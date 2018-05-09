/**
 * Graphql schema
 * */

import {
    GraphQLObjectType,
    GraphQLSchema,
} from 'graphql';

// Types
import AuthType from './types/AuthType';
import UserType from './types/UserType';


// Resolvers
import AuthNativeResolver from './resolvers/auth/AuthNativeResolver';
import UserGetResolver from './resolvers/UserGetResolver';


export default new GraphQLSchema({
    /**
     * Queries (Read only)
     * */
    query: new GraphQLObjectType({
        name: 'Query',
        description: 'The root of all queries',
        fields: () => ({
            auth_token: new AuthNativeResolver(AuthType, 'Responsible or authentication of user and provide token.'),
            user: new UserGetResolver(UserType, 'Responsible for user.')
        })
    }),
    /**
     * Data modification queries
     * */
    // mutation: new GraphQLObjectType({
    //     name: 'Mutation',
    //     description: 'Root of all data modification queries.',
    //     fields: () => ({
    //         // team: new TeamUpsertResolver(TeamType, 'Responsible for team creation and updation.'),
    //     })
    // })

});


