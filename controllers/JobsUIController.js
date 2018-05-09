/**
 *  Controller for Jobs UI
 * */

import Agendash from 'agendash';


export default class JobsUIController {

    constructor(router) {
        _frameworkEvents.on('SERVER_STARTED', () => router.use('/jobs/admin', (req, res, next) => {
            if (req.user) next();
            else res.redirect('/?redirectTo=/jobs/admin' + req.url);
        }, Agendash(_agenda)));
    }

}
