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
const Source = require('../src/models/source');
const User = require('../src/models/user');

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
  t.is(statusCode, 200);
  t.is(body.status,500);
});

//test the test-url-request with a wrong type request and a correct url
test('7) PATCH /test-url-request returns correct response and status code', async (t) => {
  const s = t.context.prefixUrl + '/general/statistics';
  const query = {url: s, type: 'PATCH', headers: 0, body: 0, params: 0};
  const {body, statusCode} = await t.context.got.get(`general/test-url-request?url=${s}&type=${query.type}`);
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
    owner: process.env.USERID,
    password: 'password'
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

//clone dashboard named testdash for which we have the id in the d_id variable. cloned_dash is the new name
test('18) POST /clone-dashboard returns correct message when dashboard is cloned', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const newName = 'cloned_dash'
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json: {dashboardId: d_id, name: newName}});
  t.assert(body.success);
  t.is(statusCode,200);
  
});

//delete the cloned dashboard to leave things clean because if we don't delete it the next time the script runs  it will fail because the cloned_dash will already exist
test('19) POST /delete-dashboard returns correct message when dashboard exists', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  let cloned_d_id; //keep track of the cloned dashboard to delete it afterwards
  {
    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    body.dashboards.forEach((dash)=> {
      if(dash.name == 'cloned_dash')
      {
        cloned_d_id = dash.id;
      }
    });
  }
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {
    id: cloned_d_id
  }});
  t.assert(body.success);
  t.is(statusCode,200);
});

//clone a sashboard with an arleady existing name
test('20) POST /clone-dashboard returns correct message when dashboard already exists', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const newName = 'testdash'
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json: {dashboardId: d_id, name: newName}});
  t.is(statusCode,200);
  t.is(body.message,'A dashboard with that name already exists.');
  t.is(body.status,409);
  
});

//for the tests regarding the check-password-needed we will create a second test user or we will use his id if the user already exists
let seconduser_id;
test('21) POST /authenticate and /create returns correct message when creating the second test user', async (t) => {
  const token = jwtSign({username: process.env.SECONDUSER,password: process.env.SECONDUSERPASSWORD,email:'test@gmail.com'});
  userexists=false;
  {
    const {body, statusCode} = await t.context.got.post(`users/authenticate`,
							{json: {email:'testt@gmail.com', username: process.env.SECONDUSER, password: process.env.SECONDUSERPASSWORD}});
    t.is(statusCode,200);
	console.log(body.message);
    if(body.message == 'Authentication Error: User not found.')
      userexists = false;
    else if(body.message == 'Authentication Error: Password does not match!')
      userexists = false;
    else
    {
      userexists = true;
      seconduser_id = body.user.id;
    }
  }
  if(!userexists)
  {
    const {body, statusCode} = await t.context.got.post(`users/create`,
	{json: {username: process.env.SECONDUSER, password: process.env.SECONDUSERPASSWORD, email: 'testt@gmail.com'}});
	console.log(body);
    t.assert(body.success);
    seconduser_id = body.id;
    t.is(statusCode,200);
  }
});

//test /check-password-needed with a non-valid dash id
test('22) POST /check-password-needed returns correct message when given dashboard id doesnt exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const wrong_dash_id = '48ab17000c66d60ad82cf9dd';
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json: {user: process.env.USERID, dashboardId: wrong_dash_id}});
  t.is(statusCode,200);
  t.is(body.message,'The specified dashboard has not been found.');
  t.is(body.status,409);
  
});

//test /check-password-needed with a dashboard that belongs to the testuser
let test_dashboard;
test('23) POST /check-password-needed returns correct message when given dashboard id doesnt exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  {
    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.is(statusCode, 200);
    body.dashboards.forEach((dash)=> {
      if(dash.name == 'testdash')
      {
        test_dashboard = dash.id;
      }
    })
  }
  const test_user = {id: process.env.USERID}
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json: {user: test_user, dashboardId: test_dashboard}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.is(body.owner,'self');
  
});

//test /check-password-needed returns correct response when a user tries to access a non-shared dashboard of another user
test('24) POST /check-password-needed returns correct response when a user tries to access a non-shared dashboard of another user', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const sec_user = {id: seconduser_id};
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json: {user: sec_user, dashboardId: test_dashboard}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.is(body.owner,'');
  t.assert(!body.shared);
  
});

//test the case that one user tries to access a different user's dashboard that is shared and with no password
test('25) POST /check-password-needed returns correct response when a user tries to access a shared dashboard of another user with no password', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const sec_user = {id: seconduser_id};
  const dash = await Dashboard({name: 'dash', shared: 1, owner: process.env.USERID }).save();
  const dashid = dash.id;
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json: {user: sec_user, dashboardId: dashid}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(body.shared);
  t.assert(!body.passwordNeeded);
  {
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {
    id: dashid
  }});
  t.is(statusCode,200);
}
});

//test the case that one user tries to access a different user's dashboard that is shared and with password needed
test('26) POST /check-password-needed returns correct response when a user tries to access a shared dashboard of another user with password', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const sec_user = {id: seconduser_id};
  const dash = await Dashboard({name: 'dash2', password: 'pass', shared: 1, owner: process.env.USERID }).save();
  const dashid = dash.id;
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json: {user: sec_user, dashboardId: dashid}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(body.shared);
  t.assert(body.passwordNeeded);
  t.is(body.owner, '');
  {
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {
    id: dashid
  }});
  t.is(statusCode,200);
}
});

//test /check-password when a wrong dash id is passed
test('27) POST /check-password returns correct message when given dashboard id doesnt exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const wrong_dash_id = '48ab17000c66d60ad82cf9dd';
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json: { dashboardId: wrong_dash_id, password:'blah'}});
  t.is(statusCode,200);
  t.is(body.message,'The specified dashboard has not been found.');
  t.is(body.status,409);
  
});

//test /check-password when a correct id is given but wrong password
test('28) POST /check-password when a correct id is given but wrong password', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const dash = await Dashboard({name: 'dash3', password: 'pass', shared: 1, owner: process.env.USERID }).save();
  const dashid = dash.id;
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json: { dashboardId: dashid, password:'wrong'}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(!body.correctPassword);
  {
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {
    id: dashid
  }});
  t.is(statusCode,200);
}
});

//test /check-password when a correct id is given and correct password
test('29) POST /check-password when a correct id is given and correct password', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const dash = await Dashboard({name: 'dash3', password: 'pass', shared: 1, owner: process.env.USERID }).save();
  const dashid = dash.id;
  const {body, statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json: { dashboardId: dashid, password:'pass'}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(body.correctPassword);
  {
  const {statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{json: {
    id: dashid
  }});
  t.is(statusCode,200);
}
});

//share a dashboard with a non-existing id
test('30) POST /share-dashboard returns correct message when dashboard id does not exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json: {dashboardId: 0}});
  t.is(statusCode,200);
  t.is(body.message,'The specified dashboard has not been found.');
  t.is(body.status,409);
});

//share a dashboard that was not being shared
test('31) POST /share-dashboard returns correct message when dashboard was not shared before', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json: {dashboardId: test_dashboard}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(body.shared);
});

//share a dashboard that was being shared
test('32) POST /share-dashboard returns correct message when dashboard was shared before', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json: {dashboardId: test_dashboard}});
  t.is(statusCode,200);
  t.assert(body.success);
  t.assert(!body.shared);
});

//change password to a dashboard that does not exist
test('33) POST /change-password returns correct message when dashboard was not shared before', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`dashboards//change-password?token=${token}`,{json: {dashboardId: 0}});
  t.is(statusCode,200);
  t.is(body.message,'The specified dashboard has not been found.');
  t.is(body.status,409);
});

//change password to a dashboard
test('33) POST /change-password returns correct message when changing the password to a dash', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`dashboards//change-password?token=${token}`,{json: {dashboardId: test_dashboard, password: "1234567"}});
  t.is(statusCode,200);
  t.assert(body.success);
});

/*
TESTING THE SOURCES ROUTER
*/

//test that /sources shows sources correctly
let testsrc_id = "";
//In case that there is already a source named testsrc we want to keep its id to delete to be able to test the create source routes from the start
test('34) GET /sources returns correct statusCode and body', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
  body.sources.forEach((src)=> {
    if(src.name == 'testsrc')
    {
      testsrc_id = src.id;
    }
  })
  t.assert(body.success);
})

//delete testsrc in case it exists
test('35) GET /delete-source deletes dashboard named testdash if it exists and returns corresponding message', async (t) => {
  if(testsrc_id!="")
  {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${token}`,{json: {
    id: testsrc_id
  }});
  t.is(statusCode,200);
  t.assert(body.success);
}
  else
    t.pass();
});

//test /sources with wrong token
test('36) GET /sources returns correct response with wrong token', async (t) => {
  const {body, statusCode} = await t.context.got(`sources/sources?token='48ab17000c66d60ad82cf9dd'`);
  t.is(body.status,403);
  t.is(body.message,'Authorization Error: Failed to verify token.');
})

test('37) POST /create-source create a new source named testsrc and get the corresponding message', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${token}`,{json: {
    name: 'testsrc',
    owner: process.env.USERID,
    password: 'password'
	}});
  t.assert(body.success);
  t.is(statusCode,200);
});

test('38) POST /create-source create an already existing source named testsrc and get the corresponding message', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${token}`,{json: {
    name: 'testsrc'
	}});
  t.is(body.message, 'A source with that name already exists.');
  t.is(body.status,409);
});

 //test if delete-source works when id is not valid
 test('39) GET /delete-source returns correct message when source with given id doesnt exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${token}`,{json: {
    id: 0
  }});
  t.is(statusCode,200);
  t.is(body.status,409);
  t.is(body.message, 'The selected source has not been found.')
});

//create a new source and then delete it and check the return messages
test('40) POST /delete-source returns correct message when source exists', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  source = await Source({name: 'newSource', owner: process.env.USERID}).save();
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${token}`,{json: {
    id: source._id
  }});
  t.assert(body.success);
  t.is(statusCode,200);
});

//selects source with name testsrc
test('41) POST /source returns correct message when source exists', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/source`,{json:
  {
    name: 'testsrc',
    owner: process.env.USERID,
    user: process.env.USERNAME
  }});
  t.assert(body.success);
  t.is(statusCode,200);
});

//selects source that does not exist
test('42) POST /source returns correct message when source does not exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/source`,{json:
  {
    name: 'non-exisitng-source',
    owner: process.env.USERID,
    user: process.env.USERNAME
  }});
  t.is(body.status, 409);
  t.is(body.message,'The selected source has not been found.');
  t.is(statusCode,200);
});

let testsrcid=""; //save the testsrc id for later;
//check-sources completes a successful check on source testsrc
test('43) POST /check-sources returns correct message checking is done', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const src = await Source.findOne({name: 'testsrc', owner: process.env.USERID});
  testsrcid = src._id;
  const {body, statusCode} = await t.context.got.post(`sources/check-sources?token=${token}`,{json:
  {
    sources: [src]
  }});
  t.is(statusCode,200);
  t.assert(body.success);
});

//try to change-source with a source id that does not exist
test('44) POST /change-source returns correct message when source does not exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${token}`,{json:
  {
    id: '63d0d3db2d0e0eb841c3a80d' //wrong source id
  }});
  t.is(body.status, 409);
  t.is(body.message,'The selected source has not been found.');
  t.is(statusCode,200);
});

//try to change-source with a source name that already exists
test('45) POST /change-source returns correct message when source name already exists', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  source = await Source({name: 'NewSource', owner: process.env.USERID}).save();
  {
    const {body, statusCode} = await t.context.got(`sources/sources?token=${token}`);
  }
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${token}`,{json:
  {
    id: source._id,
    name: 'testsrc'
  }});
  t.is(body.status, 409);
  t.is(body.message,'A source with the same name has been found.');
  t.is(statusCode,200);
  {
    const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${token}`,{json: {
    id: source._id
    }});

    t.assert(body.success);
    t.is(statusCode,200);
}
});

//try to change-source with a source id that does not exist
test('46) POST /change-source returns correct message when source does not exist', async (t) => {
  const token = jwtSign({username: process.env.USERNAME,id:process.env.USERID,email:process.env.USEREMAIL});
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${token}`,{json:
  {
    id: testsrcid,
    name: 'newName',
    type: '',
    url: '',
    login: '',
    passcode: '',
    vhost: ''
  }});
  //t.assert(body.success);
  t.is(statusCode,200);
});

/*
 TEST THE USERS ROUTER
*/

//test the create request to create a user that already exists
test('47) POST /create returns correct response and status code when user already exists by username or email', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: process.env.USEREMAIL,
      username: process.env.USERNAME,
      password: '1234567',
    }});
  t.is(body.status,409);
  t.is(body.message,'Registration Error: A user with that e-mail or username already exists.');
  t.is(statusCode, 200);
});

//test the create request to create a new user and then delete it
test('48) POST /create returns correct response and status code when creating a user', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: 'newusers@gmail.com',
      username: 'newusers',
      password: '1234567',
    }});
  t.assert(body.success);
  t.is(statusCode, 200);
  await User.deleteOne({ email: 'newusers@gmail.com'},function(err, result) {
    if (err) {
      console.log(err);
    } else {
      //console.log(result);
    }});
});


//test the create request to create a new user with a non-valid email
test('49) POST /create returns correct response and status code when creating a user with a non-valid email', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: 'newusersgmail.com',
      username: 'newusers',
      password: '1234567',
    }});
    t.is(body.status,400);
    t.is(body.message,'Validation Error: email must be a valid email');
    t.is(statusCode, 400);
});


//test the create request to create a new user with a non-valid password
test('50) POST /create returns correct response and status code when creating a user with a non-valid password', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: 'newusersgmail.com',
      username: 'newusers',
      password: '123',
    }});
    t.is(body.status,400);
    t.is(body.message,'Validation Error: password must be at least 5 characters');
    t.is(statusCode, 400);
});

//test the authenticate route with wrong username
test('51) POST /authenticate returns correct response and status code when wrong username is given', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/authenticate`,{json:
    {
      email: 'ghostUser@gmail.com',
      username: 'ghostUser',
      password: '1234567',
    }});
    t.is(body.status,401);
    t.is(body.message,'Authentication Error: User not found.');
    t.is(statusCode, 200);
});

//test the authenticate route with wrong password
test('52) POST /authenticate returns correct response and status code when wrong password is given', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/authenticate`,{json:
    {
      email: process.env.USEREMAIL,
      username: process.env.USERNAME,
      password: '1234567',
    }});
    t.is(body.status,401);
    t.is(body.message,'Authentication Error: Password does not match!');
    t.is(statusCode, 200);
});

//test the authenticate route with correct credentials for newly-created user who then gets deleted
test('53) POST /authenticate returns correct response and status code with correct credentials', async (t) => {
    const {body, statusCode} = await t.context.got.post(`users/create`,{json:
      {
        email: 'trueuser@gmail.com',
        username: 'trueuser',
        password: 'truepass',
      }});
    t.assert(body.success);
    t.is(statusCode, 200);
    {
      const {body, statusCode} = await t.context.got.post(`users/authenticate`,{json:
        {
          email: 'trueuser@gmail.com',
          username: 'trueuser',
          password: 'truepass',
        }});
        t.is(body.user.username,'trueuser');
        t.is(body.user.email,'trueuser@gmail.com');
        t.is(statusCode, 200);
    }
    await User.deleteOne({ email: 'trueuser@gmail.com'},function(err, result) {
      if (err) {
        console.log(err);
      } else {
        //console.log(result);
      }});
});

//test the resetpassword route with wrong username
test('54) POST /resetpassword returns correct response and status code when wrong username is given', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/resetpassword`,{json:
    {
      username: 'WrongUser'
    }});
    t.is(body.status,404);
    t.is(body.message,'Resource Error: User not found.');
    t.is(statusCode, 200);
});

//test the resetpassword route with correct username
test('55) POST /resetpassword returns correct response and status code when correct username is given', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/resetpassword`,{json:
    {
      username: process.env.USERNAME
    }});
    t.assert(body.ok);
    t.is(statusCode,200);
    t.is(body.message,'Forgot password e-mail sent.');
});


//test the change password utility with correct credentials for newly-created user who then gets deleted
test('56) POST /changepassword returns correct response and status code with correct credentials', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: 'trueuserr@gmail.com',
      username: 'trueuserr',
      password: 'TruePass123',
    }});
  t.is(statusCode, 200);
  console.log(body);
  const token = jwtSign({username: 'trueuserr'});
  {
    {
      const {body, statusCode} = await t.context.got.post(`users/resetpassword`,{json:
        {
          username: 'trueuserr'
        }});

    console.log(body);
    t.is(statusCode,200);
  }
  
    const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${token}`,{json:
      {
        password: 'TruePass12345'
      }});
      console.log(body);
      //t.assert(body.ok);
      //t.is(statusCode,200);
      //t.is(body.message,'Password was changed.');
  }
  
  await User.deleteOne({ email: 'trueuserr@gmail.com'},function(err, result) {
    console.log(result);
    if (err) {
      console.log("HEREEEEEEEEEEEEEEEEEEEE");
      console.log(err);
    } else {
      //console.log(result);
    }});
});

//test the change password route with no reset token
test('57) POST /changepassword returns correct response and status code when there is no reset token', async (t) => {
  const {body, statusCode} = await t.context.got.post(`users/create`,{json:
    {
      email: 'userr@gmail.com',
      username: 'userr',
      password: 'passord',
    }});
  t.is(statusCode, 200);
  const token = jwtSign({username: 'userr'});
  {
    const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${token}`,{json:
      {
        password: 'newpass'
      }});
      t.is(body.status , 410);
      t.is(body.message,' Resource Error: Reset token has expired.');
  }
  await User.deleteOne({ email: 'userr@gmail.com'},function(err, result) {
    if (err) {
      console.log(err);
    } else {
      //console.log(result);
    }});
});
