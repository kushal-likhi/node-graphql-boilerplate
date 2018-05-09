/**
 * Defines the node responsible for auth.
 * */

import {
    GraphQLString,
} from 'graphql';
import GraphQLType from '../base/GraphQLType';
import UserType from './UserType';
import UserGetResolver from '../resolvers/UserGetResolver';

export default class AuthType extends GraphQLType {

    static get name() {
        return 'auth_token';
    }

    static get description() {
        return 'Responsible for authentication tasks. Provides access token.';
    }

    static fields() {
        return {
            id: {
                type: GraphQLString,
                description: 'Id of the user'
            },
            token: {
                type: GraphQLString,
                description: 'Auth token for the user'
            },
            expires: {
                type: GraphQLString,
                description: 'Auth token for the user'
            },
            user: {
                type: UserType.toGraphQLObjectType(),
                description: 'Authenticated user.',
                resolve: (auth, args, request) => new UserGetResolver(UserType, '').resolve({}, {id: auth.id}, request)
            }
        }
    }
}
