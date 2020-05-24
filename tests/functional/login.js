const Nightmare = require('nightmare');
const assert = require('chai').assert;

const url = 'http://localhost:3333/';

describe('Funtional tests', function() {

  let browser = null;

  // the global electron timeout
  this.timeout(60 * 1000);

  beforeEach( () => {
    const options = {
      // to make the typed input much faster
      typeInterval: 20,
      // the wait function has a timeout as well
      waitTimeout: 60 * 1000,
      fullscreen: true
    };

    if (process.env.NIGHTMARE_DEBUG === '1') {
      // show the browser and the debug window
      options.openDevTools = true;
      // to show in a separate window
      //options.openDevTools = { mode: "detach" };
      options.show = true;
    }

    browser = new Nightmare(options);
    browser
      .goto(url)
      .wait(1000);
  });

  describe('Login and logout', () => {

    it('we should be redirected to the login page', done => {
      browser
        .wait( () => {
          return document.location.pathname === '/login';
        })
        .wait(500)
        .evaluate( () => { return document.location.pathname; } )
        .end()
        .then( href => {
          assert.equal(href, '/login');
        })
        .then(done)
        .catch(done);
    });

    it('we cannot login with false credentials', done => {
      browser
        .insert('#username', 'sald')
        .wait(500)
        .insert('#password', 'sald')
        .wait(500)
        .click('#login-submit')
        .wait(500)
        .wait('#notice-wrapper div.notice_auth_failed')
        .wait(1000)
        .evaluate( () => {
          return document.querySelector('#notice-wrapper div').textContent;
        })
        .end()
        .then( message => {
          assert.equal(message, 'Authentication failed');
        })
        .then(done)
        .catch(done);
    });

    it('valid credentials will redirect us to the homepage and hide the loginform', done => {
      browser
        .insert('#username', 'salt')
        .wait(500)
        .insert('#password', 'salt')
        .wait(500)
        .click('#login-submit')
        .wait(500)
        .wait( () => {
          // we wait here for the loginpage to be hidden
          const loginpage = document.querySelector('#page-login');
          return loginpage.style.display === 'none';
        })
        .wait(1000)
        .evaluate( () => { return document.location.pathname; })
        .end()
        .then( href => {
          assert.equal(href, "/");
        })
        .then(done)
        .catch(done);
    });

    it('check that we can logout', done => {
      browser
        .insert('#username', 'salt')
        .wait(500)
        .insert('#password', 'salt')
        .wait(500)
        .click('#login-submit')
        .wait(500)
        .wait('#notice-wrapper div.notice_please_wait')
        .wait(5000)
        .wait( () => {
          // we wait here for the loginpage to be hidden
          const loginpage = document.querySelector('#page-login');
          return loginpage.style.display === 'none';
        })
        .click('#button-logout1')
        .wait(500)
        .wait( () => {
          // we wait here for the loginpage to be shown
          const loginpage = document.querySelector('#page-login');
          return loginpage.style.display === '';
        })
        .wait( () => {
          return document.location.pathname === '/login');
        })
        .wait(1000)
        .evaluate( () => { return document.location.pathname + ":" + document.location.search; })
        .end()
        .then( href => {
          // and we redirected to the login page
          assert.equal(href, '/login:?reason=logout');
        })
        .then(done)
        .catch(done);
    });

  });

});
