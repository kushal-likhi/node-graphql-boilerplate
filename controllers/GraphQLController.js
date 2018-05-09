/**
 *  Controller for graph QL
 * */

import graphqlHTTP from 'express-graphql';
import GraphQLSchema from '../models/graphql/GraphQLSchema';


export default class GraphQLController {

    constructor(router) {
        router.post('/api/v1/graph', graphqlHTTP({
            schema: GraphQLSchema,
            graphiql: false
        }));

        router.get('/api/v1/graph', graphqlHTTP({
            schema: GraphQLSchema,
            graphiql: _appEnv !== 'production'
        }));
    }

}
