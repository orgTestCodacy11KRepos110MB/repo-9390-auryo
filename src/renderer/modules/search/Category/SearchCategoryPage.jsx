import React from 'react'
import * as actions from '../../../../shared/actions'
import {
    OBJECT_TYPES,
    SEARCH_PLAYLISTS_SUFFIX,
    SEARCH_TRACKS_SUFFIX,
    SEARCH_USERS_SUFFIX
} from '../../../../shared/constants'
import { connect } from 'react-redux'
import Spinner from '../../_shared/Spinner/Spinner'
import './searchCategory.scss'
import TracksGrid from '../../_shared/TracksGrid/TracksGrid'
import { denormalize, schema } from 'normalizr'
import playlistSchema from '../../../../shared/schemas/playlist'
import { userSchema } from '../../../../shared/schemas'
import trackSchema from '../../../../shared/schemas/track'
import isEqual from 'lodash/isEqual'

class SearchCategory extends React.Component {
    state = {
        loading: false
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(nextProps.query, this.props.query) ||
            !isEqual(nextProps.playlist_object, this.props.playlist_object) ||
            !isEqual(nextState.loading, this.state.loading)) {
            return true
        }
        return false

    }

    componentDidMount() {
        const { query, search, playlist_object, object_id } = this.props

        if (!playlist_object && query && query.length) {

            this.setState({
                loading: true
            })
            search(object_id, query, 25)
                .then(() => {
                    this.setState({
                        loading: false
                    })
                })
        }
    }

    componentWillReceiveProps(nextProps) {
        const { query, search, playlist_object, object_id } = this.props

        if ((query !== nextProps.query || !playlist_object) && query && query.length) {
            this.setState({
                loading: true
            })
            search(object_id, nextProps.query, 25)
                .then(() => {
                    this.setState({
                        loading: false
                    })
                })
        }
    }

    hasMore = () => {
        const { object_id } = this.props
        return this.props.canFetchMoreOf(object_id, OBJECT_TYPES.PLAYLISTS)
    }

    loadMore = () => {
        const { object_id } = this.props

        if (this.props.canFetchMoreOf(object_id, OBJECT_TYPES.PLAYLISTS)) {
            this.props.fetchMore(object_id, OBJECT_TYPES.PLAYLISTS)
        }
    }

    render() {
        const {
            player,
            entities,
            auth: { followings },
            results,
            fetchPlaylistIfNeeded,
            playTrack,
            object_id,
            toggleFollowing
        } = this.props

        if (this.state.loading) {
            return <Spinner />
        }

        return (
            <div>
                <TracksGrid
                    toggleFollowing={toggleFollowing}
                    followings={followings}
                    items={results}
                    player={player}
                    playlist_name={object_id}
                    entities={entities}
                    playTrackFunc={playTrack}
                    fetchPlaylistIfNeededFunc={fetchPlaylistIfNeeded}
                />
            </div>
        )
    }
}

function mapStateToProps(state, props) {
    const { auth, entities, objects, player: { playingTrack }, app, player } = state
    const { match: { params } } = props

    const playlist_objects = objects[OBJECT_TYPES.PLAYLISTS] || {}

    let object_id

    switch (params.category) {
        case 'user':
            object_id = props.query + SEARCH_USERS_SUFFIX
            break
        case 'playlist':
            object_id = props.query + SEARCH_PLAYLISTS_SUFFIX
            break
        case 'track':
            object_id = props.query + SEARCH_TRACKS_SUFFIX
            break
    }

    const playlist_object = playlist_objects[object_id]

    let denormalized = []

    if (playlist_object) {
        denormalized = denormalize(playlist_object.items, new schema.Array({
            playlists: playlistSchema,
            tracks: trackSchema,
            users: userSchema
        }, (input) => `${input.kind}s`), entities)
    }

    return {
        object_id,
        entities,
        auth,
        playingTrack,
        app,
        results: denormalized,
        player,
        playlist_object,
        params: {
            category: params.category,
            query: props.query
        }
    }
}

export default connect(mapStateToProps, actions, null, { withRef: true })(SearchCategory)