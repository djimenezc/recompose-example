import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { switchMap, map, startWith, scan } from 'rxjs/operators'
import { compose, mapPropsStream, createEventHandler, getContext } from 'recompose'

import { TableContainer, LikesContainer, ListItem, ListHeader, AddPopup } from './styledComponents'

const modalHandler = mapPropsStream(props$ => {
    const { stream: isOpen$, handler: toggleModal } = createEventHandler()
    return props$.pipe(
        switchMap(props =>
            isOpen$.pipe(
                startWith(false),
                scan(bool => !bool),
                map(isOpen => ({...props, isOpen, toggleModal }))
            )
        )
    )
})

const textHandler = mapPropsStream(props$ => {
    const { stream: onInput$, handler: handleChange } = createEventHandler()
    const text$ = onInput$.pipe(map(e => e.target.value), startWith(''))
    return props$.pipe(
        switchMap(props => text$.pipe(map(text => ({...props, text, handleChange }))))
    )
})

const LikesList = ({
    user: { likes, user },
    updateFunctions: { addLike, deleteLike },
    isOpen,
    text,
    handleChange,
    toggleModal
}) => ( <
    Fragment >
    <
    ListHeader >
    <
    h3 style = {
        { margin: 0 } } > Likes < /h3> <
    i className = "material-icons"
    style = {
        { cursor: 'pointer' } }
    onClick = { toggleModal } >
    add <
    /i> <
    /ListHeader> <
    LikesContainer style = {
        { marginBottom: 20 } } >
    <
    AddPopup open = { isOpen }
    onChange = { handleChange }
    handleSubmit = {
        () => addLike(user, text) }
    closeModal = { toggleModal }
    text = { text }
    /> {
        likes.map(like => ( <
            ListItem open = { isOpen }
            key = { like.item + like.id } > { like.item } <
            i className = "material-icons"
            onClick = {
                () => deleteLike(user, like) } >
            delete <
            /i> <
            /ListItem>
        ))
    } <
    /LikesContainer> <
    /Fragment>
)

const Likes = compose(
    modalHandler,
    textHandler,
    getContext({ updateFunctions: PropTypes.object, user: PropTypes.object })
)(LikesList)

const DislikesList = ({
    user: { dislikes, user },
    updateFunctions: { addDislike, deleteDislike },
    isOpen,
    text,
    handleChange,
    toggleModal
}) => ( <
    Fragment >
    <
    ListHeader >
    <
    h3 style = {
        { margin: 0 } } > Dislikes < /h3> <
    i className = "material-icons"
    style = {
        { cursor: 'pointer' } }
    onClick = { toggleModal } >
    add <
    /i> <
    /ListHeader> <
    LikesContainer >
    <
    AddPopup open = { isOpen }
    onChange = { handleChange }
    handleSubmit = {
        () => addDislike(user, text) }
    closeModal = { toggleModal }
    text = { text }
    /> {
        dislikes.map(dislike => ( <
            ListItem open = { isOpen }
            key = { dislike.item + dislike.id } > { dislike.item } <
            i className = "material-icons"
            onClick = {
                () => deleteDislike(user.user, dislike) } >
            delete <
            /i> <
            /ListItem>
        ))
    } <
    /LikesContainer> <
    /Fragment>
)

const Dislikes = compose(
    modalHandler,
    textHandler,
    getContext({ updateFunctions: PropTypes.object, user: PropTypes.object })
)(DislikesList)

export const InfoTables = () => {
    return ( <
        TableContainer >
        <
        Likes / >
        <
        Dislikes / >
        <
        /TableContainer>
    )
}