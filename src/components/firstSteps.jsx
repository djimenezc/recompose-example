import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { render } from 'react-dom'
import { from, to, of } from 'rxjs'
import { switchMap, map, startWith, tap, catchError } from 'rxjs/operators'
import {
  compose,
  mapPropsStream,
  createEventHandler,
  withState,
  withHandlers,
  setObservableConfig,
  withContext
} from 'recompose'
import { BrowserRouter, withRouter, Route } from 'react-router-dom'
import { get, isEmpty } from 'lodash'
import { PageWrapper, ListContainer, ListItem, Loader, UserContainer } from './styledComponents'
import { InfoTables } from './InfoTables'
import {
  fetchUsers,
  addUserLike,
  addUserDislike,
  deleteUserDislike,
  deleteUserLike,
  putUserDislike,
  putUserLike
} from './asyncData'

setObservableConfig({
  fromESObservable: from,
  toESObservable: to
})

// Create prop streams
//=============================

// First, load the list of users
const load = mapPropsStream(props$ =>
  props$.pipe(
    switchMap(
      props =>
        isEmpty(props.userList)
          ? from(fetchUsers()).pipe(
              tap(users => props.setUserList(users)),
              map(users => ({ ...props, users, status: 'SUCCESS' })),
              startWith({ status: 'REQUEST', ...props })
            )
          : of(props).pipe(map(props => ({ ...props, status: 'SUCCESS' })))
    ),
    catchError(() => ({ status: 'ERROR', message: 'Looks like our service is down' }))
  )
)

// Second, create a stream to handle selecting a user
const selectUser = mapPropsStream(props$ => {
  const { stream: selected$, handler: userSelect } = createEventHandler()
  return props$.pipe(
    switchMap(props => {
      const userInURL = get(props, 'match.params.user')
      return selected$
        .pipe(
          startWith(
            props.userList && userInURL
              ? props.userList.find(userInList => userInList.user === userInURL)
              : props.userList[0]
          )
        )
        .pipe(map(selectedUser => ({ ...props, selectedUser, userSelect })))
    })
  )
})

// Now, create a component to receive the props from the stream
const IndexPage = ({
  status,
  userList,
  selectedUser,
  userSelect,
  message,
  match,
  history,
  deleteLike,
  deleteDislike
}) => {
  const userParam = get(match, 'params.user')
  if (selectedUser) {
    userParam !== selectedUser.user && history.push(`/${selectedUser.user}`)
  }
  return (
    <PageWrapper>
      <UserContainer>
        {status === 'SUCCESS' ? (
          <Fragment>
            <h3>Users</h3>
            <ListContainer style={{ height: '500px' }}>
              {userList.map((user, i) => (
                <ListItem key={i} onClick={() => userSelect(user)} selected={user === selectedUser}>
                  <p>{user.user}</p>
                </ListItem>
              ))}
            </ListContainer>
          </Fragment>
        ) : (
          <Loader status={status} message={message} />
        )}
      </UserContainer>
      {selectedUser && <InfoTables />}
    </PageWrapper>
  )
}
// Merge all the streams together and map them into the component
// NOTE: they receive props in the order they are passed to the compose function
const StreamIndex = compose(
  withState('userList', 'updateUserList', []),
  withHandlers({
    setUserList: ({ updateUserList }) => users => updateUserList(state => users),
    addLike: ({ updateUserList }) => (user, like) => addUserLike(user, like),
    addDislike: ({ updateUserList }) => (user, dislike) => addUserDislike(user, dislike),
    deleteLike: ({ updateUserList }) => (user, like) =>
      deleteUserLike(user, like.id).then(() =>
        updateUserList(state => [
          ...state.map(i => {
            if (i.user === user) {
              i.likes = i.likes.filter(i => i.id !== like.id)
            }
            return i
          })
        ])
      ),
    deleteDislike: ({ updateUserList }) => (user, dislike) =>
      deleteUserDislike(user, dislike.id).then(() =>
        updateUserList(state => [
          ...state.map(i => {
            if (i.user === user) {
              i.dislikes = i.dislikes.filter(i => i.id !== dislike.id)
            }
            return i
          })
        ])
      )
  }),
  withRouter,
  load,
  selectUser,
  withContext(
    { updateFunctions: PropTypes.object, user: PropTypes.object },
    ({ selectedUser, addLike, addDislike, deleteLike, deleteDislike }) => ({
      user: selectedUser,
      updateFunctions: { addLike, addDislike, deleteLike, deleteDislike }
    })
  )
)(IndexPage)

const App = () => (
  <BrowserRouter>
    <div>
      <h2>RXJS recompose Demo</h2>
      <Route path="/:user?" render={() => <StreamIndex />} />
    </div>
  </BrowserRouter>
)

export default App