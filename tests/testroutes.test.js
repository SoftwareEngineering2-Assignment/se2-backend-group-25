
/* eslint-disable import/no-unresolved */

//require('dotenv').config();

/*

It was preffered that all the tests for all the routers were implemented in this unique testing script to avoid creating

multiple testing servers

The routers tested in this file are executed sequentially following the order:

1)general

2)dashboards

3)sources

4)users

*/



//Every time the test script runs it assumes that the test database is empty with no dashboards or sources



const http = require('node:http');

const test = require('ava').default;

const got = require('got');

const listen = require('test-listen');




const app = require('../src/index');

const {jwtSign} = require('../src/utilities/authentication/helpers');

const Dashboard = require('../src/models/dashboard');



test.before(async (t) => {

t.context.server = http.createServer(app);

t.context.prefixUrl = await listen(t.context.server);

t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});

});



test.after.always((t) => {

t.context.server.close();

});



/*

TESTING THE GENERAL ROUTER

*/



//test the statistics request

test('1) GET /statistics returns correct response and status code', async (t) => {

const {body, statusCode} = await t.context.got('general/statistics');

t.assert(body.success);

t.is(statusCode, 200);

});



//test the test-url with a correct url

test('2) GET /test url returns active true and status code 200 for url general/statistics', async (t) => {

const s = t.context.prefixUrl + '/general/statistics';

const {body, statusCode} = await t.context.got(`general/test-url?url=${s}`);

t.is(statusCode, 200);

t.is(body.status,200);

t.assert(body.active);

});



//test the test-url with a wrong url

test('3) GET /test url returns active false and status code 500 for wrong url general/statistic', async (t) => {

const s = t.context.prefixUrl + '/general/statistic';

const {body, statusCode} = await t.context.got(`general/test-url?url=${s}`);

t.is(statusCode, 200);

t.is(body.status,500);

t.assert(!body.active);

});





//test the test-url-request with a get request and a correct url

test('4) GET /test-url-request returns correct response and status code', async (t) => {

const s = t.context.prefixUrl + '/general/statistics';

const query = {url: s, type: 'GET', headers: 0, body: 0, params: 0};

const {body, statusCode} = await t.context.got.get(`general/test-url-request?url=${s}&type=${query.type}`);

t.is(statusCode, 200);

t.is(body.status,200);

});



//test the test-url-request with a post request which is to authenticate a fake user

test('5) POST /test-url-request returns correct response and status code', async (t) => {

const s = t.context.prefixUrl + '/users/authenticate';

const query = {url: s, type: 'POST', headers: 0, body: 0, params: 0};

const {body, statusCode} = await t.context.got.get(`general/test-url-request?url=${s}&type=${query.type}&body={"username": "fakeuser", "password": "wrongpassword"}`);

t.is(statusCode, 200);

t.is(body.status,200);

});



//test the test-url-request with a put request but we dont have any valid put request to test it so the response will be an error with status 500

test('6) PUT /test-url-request returns correct response and status code', async (t) => {

const s = t.context.prefixUrl + '/general/statistics';

const query = {url: s, type: 'PUT', headers: 0, body: 0, params: 0};

const {body, statusCode} = await t.context.got.get(`general/test-url-request?url=${s}&type=${query.type}&body={}`);

console.log(body);

t.is(statusCode, 200);

t.is(body.status,500);

});



//test the test-url-request with a wrong type request and a correct url

test('7) PATCH /test-url-request returns correct response and status code', async (t) => {

const s = t.context.prefixUrl + '/general/statistics';

const query = {url: s, type: 'PATCH', headers: 0, body: 0, params: 0};

const {body, statusCode} = await t.context.got.get(`general/test-url-request?url=${s}&type=${query.type}`);

console.log(body);

t.is(statusCode, 200);

t.is(body.status,500);

});



/*

TESTING THE DASHBOARD ROUTER

*/



//test that /dashboards shows dashboards correctly

let testdash_id = "";

//In case that there is already a dashboard named testdash we want to keep its id to delete to be able to test the create dash routes from the start

test('8) GET /dashboards returns correct statusCode and body', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

t.is(statusCode, 200);

console.log(body);

body.dashboards.forEach((dash)=> {

if(dash.name == 'testdash')

{

testdash_id = dash.id;

}

})

t.assert(body.success);

})



//delete testdash in case it exists

test('9) GET /delete-dashboard deletes dashboard named testdash if it exists and returns corresponding message', async (t) => {

if(testdash_id!="")

{

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {

id: testdash_id

}});

t.is(statusCode,200);

t.assert(body.success);

}

else

t.pass();

});







test('10) POST /create-dashboard create a new dashboard named testdash and get the corresponding message', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{json: {

name: 'testdash',

owner: process.env.USERID

}});

t.assert(body.success);

t.is(statusCode,200);

});



test('11) POST /create-dashboard create an already existing dashboard named testdash and get the corresponding message', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{json: {

name: 'testdash'

}});

t.is(body.message, 'A dashboard with that name already exists.');

t.is(body.status,409);

});



//test if delete-dashboard works when id is not valid

test('12) GET /delete-dashboard returns correct message when dashboard with given id doesnt exist', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {

id: 0

}});

t.is(statusCode,200);

t.is(body.status,409);

t.is(body.message, 'The selected dashboard has not been found.')

});



//create a new dashboard and then delete it and check the return messages

test('13) POST /delete-dashboard returns correct message when dashboard exists', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

dash = await Dashboard({name: 'newDash', owner: process.env.USERID}).save();

const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {

id: dash._id

}});

t.assert(body.success);

t.is(statusCode,200);

});



let d_id;

//display dashboards and then select dashboard with specific id

test('14) GET /dashboard returns correct message when dashboard exists', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

body.dashboards.forEach((dash)=> {

if(dash.name == 'testdash')

{

d_id = dash.id;

}

})

{ //change scope to redefine body and statusCode

const {body, statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${d_id}`);

t.is(body.dashboard.name, 'testdash');

t.assert(body.success);

t.is(statusCode,200);

}

});



//select dashboard with non valid non existing id

test('15) GET /dashboard returns correct message when dashboard does not exist', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

let false_d_id = '63bd595dff3e625aff3e22bf'; //non valid id

const {body, statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${false_d_id}`);

t.is(body.status, 409);

t.is(body.message,'The selected dashboard has not been found.');

t.is(statusCode,200);

});



//save dashboard named testdash for which we have the id in the d_id variable

test('16) POST /save-dashboard returns correct message when dashboard is saved', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{json: {id: d_id}});

t.assert(body.success);

t.is(statusCode,200);

});



//save a non existing dashboard

test('17) POST /save-dashboard returns correct message when dashboard doesnt exist', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

let false_d_id = '63bd595dff3e625aff3e22bf'; //non valid id

const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{json: {id: false_d_id}});

t.is(body.status,409);

t.is(body.message,'The selected dashboard has not been found.');

t.is(statusCode,200);

});



//save dashboard named testdash for which we have the id in the d_id variable

test('16) POST /save-dashboard returns correct message when dashboard is saved', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{json: {id: d_id}});

t.assert(body.success);

t.is(statusCode,200);

});



//save a non existing dashboard

test('17) POST /save-dashboard returns correct message when dashboard doesnt exist', async (t) => {

const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});

let false_d_id = '63bd595dff3e625aff3e22bf'; //non valid id

const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{json: {id: false_d_id}});

t.is(body.status,409);

t.is(body.message,'The selected dashboard has not been found.');

t.is(statusCode,200);

});



//Test the sources router



test('GET /sources returns correct response and status code', async (t) => {

const token = jwtSign({username:"papadopg",id:"63b4d61ae149bf134cdc92b4",email:"papadopg@ece.auth.gr"});

const {statusCode , body} = await t.context.got(`sources/sources?token=${token}`);

t.is(statusCode, 200);

t.assert(body.success);

t.is(body.sources.length,1);

t.is(body.sources[0].name == 'test',true);

});



test('POST /create-source create an already existing source named test and get the corresponding message', async (t) => {

const token = jwtSign({username:"papadopg",id:"63b4d61ae149bf134cdc92b4",email:"papadopg@ece.auth.gr"});

const obj = {id: token,name: 'test'}

const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${token}`,{json: {

name: 'test'

}});

console.log(body);

t.is(body.status,409);

});
