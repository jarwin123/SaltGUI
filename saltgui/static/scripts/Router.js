import {API} from './Api.js';
import {BeaconsMinionRoute} from './routes/BeaconsMinion.js';
import {BeaconsRoute} from './routes/Beacons.js';
import {CommandBox} from './CommandBox.js';
import {GrainsMinionRoute} from './routes/GrainsMinion.js';
import {GrainsRoute} from './routes/Grains.js';
import {JobRoute} from './routes/Job.js';
import {JobsRoute} from './routes/Jobs.js';
import {KeysRoute} from './routes/Keys.js';
import {LoginRoute} from './routes/Login.js';
import {MinionsRoute} from './routes/Minions.js';
import {OptionsRoute} from './routes/Options.js';
import {PillarsMinionRoute} from './routes/PillarsMinion.js';
import {PillarsRoute} from './routes/Pillars.js';
import {SchedulesMinionRoute} from './routes/SchedulesMinion.js';
import {SchedulesRoute} from './routes/Schedules.js';
import {TemplatesRoute} from './routes/Templates.js';

export class Router {

  constructor() {
    this._logoutTimer = this._logoutTimer.bind(this);

    this.api = new API();
    this.commandbox = new CommandBox(this.api);
    this.currentRoute = undefined;
    this.routes = [];

    this._registerRoute(this.loginRoute = new LoginRoute(this));
    this._registerRoute(this.minionsRoute = new MinionsRoute(this));
    this._registerRoute(this.keysRoute = new KeysRoute(this));
    this._registerRoute(this.grainsRoute = new GrainsRoute(this));
    this._registerRoute(this.grainsMinionRoute = new GrainsMinionRoute(this));
    this._registerRoute(this.schedulesRoute = new SchedulesRoute(this));
    this._registerRoute(this.schedulesMinionRoute = new SchedulesMinionRoute(this));
    this._registerRoute(this.pillarsRoute = new PillarsRoute(this));
    this._registerRoute(this.pillarsMinionRoute = new PillarsMinionRoute(this));
    this._registerRoute(this.beaconsRoute = new BeaconsRoute(this));
    this._registerRoute(this.beaconsMinionRoute = new BeaconsMinionRoute(this));
    this._registerRoute(this.jobRoute = new JobRoute(this));
    this._registerRoute(this.jobsRoute = new JobsRoute(this));
    this._registerRoute(this.templatesRoute = new TemplatesRoute(this));
    this._registerRoute(this.optionsRoute = new OptionsRoute(this));

    // show template menu item if templates defined
    const templatesText = window.sessionStorage.getItem("templates");
    if(templatesText && templatesText !== "undefined") {
      const item1 = document.querySelector("#button-templates1");
      item1.style.display = "inline-block";
      const item2 = document.querySelector("#button-templates2");
      item2.style.display = "inline-block";
    }

    this._registerRouterEventListeners();

    this.showRoute(this.loginRoute);
  }

  _registerRouterEventListeners() {
    document.querySelector(".logo")
      .addEventListener("click", pClickEvent => {
        if(window.location.pathname === config.NAV_URL + "/login") return;
        if(window.event.ctrlKey) {
          this.showRoute(this.optionsRoute);
        } else {
          this.showRoute(this.minionsRoute);
        }
      });

    document.querySelector("#button-minions1")
      .addEventListener("click", pClickEvent =>
        this.showRoute(this.minionsRoute)
      );
    document.querySelector("#button-minions2")
      .addEventListener("click", pClickEvent =>
        this.showRoute(this.minionsRoute)
      );

    document.querySelector("#button-grains1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.grainsRoute)
      );
    document.querySelector("#button-grains2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.grainsRoute)
      );

    document.querySelector("#button-schedules1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.schedulesRoute)
      );
    document.querySelector("#button-schedules2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.schedulesRoute)
      );

    document.querySelector("#button-pillars1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.pillarsRoute)
      );
    document.querySelector("#button-pillars2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.pillarsRoute)
      );

    document.querySelector("#button-beacons1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.beaconsRoute)
      );
    document.querySelector("#button-beacons2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.beaconsRoute)
      );

    document.querySelector("#button-keys1")
      .addEventListener("click", pClickEvent =>
        this.showRoute(this.keysRoute)
      );
    document.querySelector("#button-keys2")
      .addEventListener("click", pClickEvent =>
        this.showRoute(this.keysRoute)
      );

    document.querySelector("#button-jobs1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.jobsRoute)
      );
    document.querySelector("#button-jobs2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.jobsRoute)
      );

    document.querySelector("#button-templates1")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.templatesRoute)
      );
    document.querySelector("#button-templates2")
      .addEventListener('click', pClickEvent =>
        this.showRoute(this.templatesRoute)
      );

    document.querySelector("#button-logout1")
      .addEventListener("click", pClickEvent => {
        this.api.logout().then(
          pLogoutData => this.showRoute(this.loginRoute, {"reason": "logout"})
        );});
    document.querySelector("#button-logout2")
      .addEventListener("click", pClickEvent => {
        this.api.logout().then(
          pLogoutData => this.showRoute(this.loginRoute, {"reason": "logout"})
        );});

    // don't verify the session too often
    setInterval(this._logoutTimer, 60000);
  }

  _logoutTimer() {
    // are we logged in?
    const token = window.sessionStorage.getItem("token");
    if(!token) return;

    // just a random lightweight api call
    const wheelConfigValuesPromise = this.api.getWheelConfigValues();
    // don't act in the callbacks
    // Api.apiRequest will do all the work
    wheelConfigValuesPromise.then(pWheelConfigValuesData => {
      // VOID
    }, pWheelConfigValuesMsg => {
      // VOID
    });
  }

  _registerRoute(pRoute) {
    this.routes.push(pRoute);
    if(pRoute.onRegister) pRoute.onRegister();
  }

  goTo(pPath, hasPathPrefix=false) {
    if(this.switchingRoute) return;
    if(window.location.pathname === config.NAV_URL + pPath && this.currentRoute) return;
    const pathUrl = (hasPathPrefix ? "" : config.NAV_URL) + pPath.split("?")[0];
    for(const route of this.routes) {
      if(!route.getPath().test(pathUrl)) continue;
      // push history state for login (including redirect to /)
      if(pPath === config.NAV_URL + "/login" || pPath === config.NAV_URL + "/") window.history.pushState({}, undefined, pPath);
      this.showRoute(route, { });
      return;
    }
    // route could not be found
    // just go to the main page
    this.goTo("/");
  }

  showRoute(pRoute, pParameters) {
    const myThis = this;

    for(const key in pParameters) {
      window.sessionStorage.setItem(key, pParameters[key]);
    }

    pRoute.getPageElement().style.display = "";

    const minionMenuItem = document.getElementById("button-minions1");
    const jobsMenuItem = document.getElementById("button-jobs1");

    const activeMenuItems = Array.from(document.querySelectorAll(".menu-item-active"));
    activeMenuItems.forEach(
      function (e){ e.classList.remove("menu-item-active"); }
    );

    const elem1 = pRoute.getMenuItemElement1();
    if(elem1) {
      elem1.classList.add("menu-item-active");
      // activate also parent menu item if child element is selected
      if(elem1.id === "button-pillars1" ||
         elem1.id === "button-schedules1" ||
         elem1.id === "button-grains1" ||
         elem1.id === "button-beacons1") {
        minionMenuItem.classList.add("menu-item-active");
      }
      if(elem1.id === "button-jobs1" ||
         elem1.id === "button-templates1") {
        jobsMenuItem.classList.add("menu-item-active");
      }
    }

    const elem2 = pRoute.getMenuItemElement2();
    if(elem2) {
      elem2.classList.add("menu-item-active");
    }

    this.switchingRoute = true;

    pRoute.onShow();

    // start the event-pipe (again)
    // it is either not started, or needs restarting
    this.api.getEvents(this);

    if(myThis.currentRoute && pRoute !== myThis.currentRoute) {
      myThis._hideRoute(myThis.currentRoute);
    }

    myThis.currentRoute = pRoute;
    myThis.currentRoute.getPageElement().classList.add("current");
    document.title = "SaltGUI - " + myThis.currentRoute.getName();

    myThis.switchingRoute = false;
  }

  _hideRoute(pRoute) {
    const page = pRoute.getPageElement();
    page.classList.remove("current");
    // 500ms matches the timeout in main.css (.route)
    setTimeout(function() {
      // Hide element after fade, so it does not expand the body
      page.style.display = "none";
    }, 500);
  }

}
