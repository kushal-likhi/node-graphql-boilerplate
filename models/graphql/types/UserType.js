/**
 * Defines the node responsible for auth.
 * */

import {
    GraphQLString,
    GraphQLFloat,
    GraphQLList
} from 'graphql';
import GraphQLType from '../base/GraphQLType';

export default class UserType extends GraphQLType {

    static get name() {
        return 'user';
    }

    static get description() {
        return 'Get User Information.';
    }

    static fields() {

        return {
            name: {
                type: GraphQLString,
                description: 'Name of the user'
            },
            email: {
                type: GraphQLString,
                description: 'Email the user'
            },
            dateCreated: {
                type: GraphQLFloat,
                description: 'date created time stamp',
                resolve: user => +(user.dateCreated)
            }
        }
    }
}
