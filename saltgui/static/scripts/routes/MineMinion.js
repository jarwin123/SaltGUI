import {DropDownMenu} from '../DropDown.js';
import {Output} from '../output/Output.js';
import {PageRoute} from './Page.js';
import {Route} from './Route.js';
import {Utils} from '../Utils.js';

export class MineMinionRoute extends PageRoute {

  constructor(pRouter) {
    super("mineminion", "Mine", "#page-mine-minion", "#button-mine", pRouter);

    this._handleLocalMineGet = this._handleLocalMineGet.bind(this);
    this._handleLocalMineValid = this._handleLocalMineValid.bind(this);
    this._updateNextMine = this._updateNextMine.bind(this);

    const closeButton = this.pageElement.querySelector("#mine-minion-button-close");
    closeButton.addEventListener("click", pClickEvent =>
      this.router.goTo("/mine")
    );

    Utils.makeTableSortable(this.getPageElement());
    Utils.makeTableSearchable(this.getPageElement());
  }

  onShow() {
    const myThis = this;

    const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));

    const titleElement = document.getElementById("mine-minion-title");
    titleElement.innerText = "Mine on " + minionId;

    const localMineValidPromise = this.router.api.getLocalMineValid(minionId);
    const runnerJobsListJobsPromise = this.router.api.getRunnerJobsListJobs();
    const runnerJobsActivePromise = this.router.api.getRunnerJobsActive();

    localMineValidPromise.then(pLocalMineValidData => {
      myThis._handleLocalMineValid(pLocalMineValidData, minionId);
    }, pLocalMineValidMsg => {
      myThis._handleLocalMineValid(JSON.stringify(pLocalMineValidMsg), minionId);
    });

    runnerJobsListJobsPromise.then(pRunnerJobsListJobsData => {
      myThis.handleRunnerJobsListJobs(pRunnerJobsListJobsData);
      runnerJobsActivePromise.then(pRunnerJobsActiveData => {
        myThis.handleRunnerJobsActive(pRunnerJobsActiveData);
      }, pRunnerJobsActiveMsg => {
        myThis.handleRunnerJobsActive(JSON.stringify(pRunnerJobsActiveMsg));
      });
    }, pRunnerJobsListJobsMsg => {
      myThis.handleRunnerJobsListJobs(JSON.stringify(pRunnerJobsListJobsMsg));
    }); 

    // to update details
    // interval should be larger than the retrieval time
    // to prevent many of such jobs to appear
    setInterval(this._updateNextMine, 1000);
  }

  _updateNextMine() {
    const tbody = this.pageElement.querySelector("table#mine-minion-list tbody");
    // find an item still marked as "(click)"
    for(const tr of tbody.rows) {
      const detailsField = tr.querySelector("td.mine-value2");
      if(detailsField.innerText !== "(click)") continue;
      const mineId = tr.querySelector("td").innerText;
      detailsField.classList.add("no-status");
      detailsField.innerText = "loading...";
      this._getMineDetails(detailsField, mineId);
      // only update one item at a time
      return;
    }
  }

  _getMineDetails(pDetailsField, pMineId) {
    const myThis = this;

    const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));
    const localMineGetPromise = this.router.api.getLocalMineGet(minionId, "*", pMineId);

    localMineGetPromise.then(pLocalMineGetData => {
      myThis._handleLocalMineGet(pDetailsField, minionId, pMineId, pLocalMineGetData.return[0][minionId]);
    }, pLocalMineGetData => {
      myThis._handleLocalMineGet(pDetailsField, minionId, pMineId, JSON.stringify(pLocalMineGetData));
      const detailsField = tr.querySelector("td.mine-value2");
    });
  }

  _handleLocalMineGet(pDetailsField, pMinionId, pMineId, pLocalMineGetData) {
    pDetailsField.innerText = Output.formatObject(pLocalMineGetData);
  }

  _handleLocalMineValid(pLocalMineValidData, pMinionId) {
    const panel = document.getElementById("mine-minion-panel");
    const menu = new DropDownMenu(panel);
    this._addMenuItemMineFlush(menu, pMinionId);

    const container = document.getElementById("mine-minion-list");

    // new menus are always added at the bottom of the div
    // fix that by re-adding it to its proper place
    const titleElement = document.getElementById("mine-minion-title");
    panel.insertBefore(menu.menuDropdown, titleElement.nextSibling);

    if(PageRoute.showErrorRowInstead(container.tBodies[0], pLocalMineValidData)) return;

    let mine = pLocalMineValidData.return[0][pMinionId];
    if(mine === null) {
      mine = {};
    }

    if(mine === undefined) {
      const msgDiv = this.pageElement.querySelector("div.minion-list .msg");
      msgDiv.innerText = "Unknown minion '" + pMinionId + "'";
      return;
    }
    if(mine === false) {
      const msgDiv = this.pageElement.querySelector("div.minion-list .msg");
      msgDiv.innerText = "Minion '" + pMinionId + "' did not answer";
      return;
    }
    const mineNames = Object.keys(mine).sort();
    for(const mineName of mineNames) {
      const mineTr = document.createElement('tr');

      const mineNameTd = Route.createTd("mine-name", mineName);
      mineTr.appendChild(mineNameTd);

      let obj = mine[mineName];
      if(Array.isArray(obj) && obj.length === 1)
        obj = obj[0];
      const mineValue = Output.formatObject(obj);

      const menu = new DropDownMenu(mineTr);
      this._addMenuItemMineDelete(menu, pMinionId, mineName, mine);

      // menu comes before this data on purpose
      const mineValue1Td = Route.createTd("mine-value1", mineValue);
      mineTr.appendChild(mineValue1Td);

      const mineValue2Td = Route.createTd("mine-value2", "(click)");
      mineTr.appendChild(mineValue2Td);

      container.tBodies[0].appendChild(mineTr);
    }

    const msgDiv = this.pageElement.querySelector("div.minion-list .msg");
    const txt = Utils.txtZeroOneMany(mineNames.length,
      "No mines", "{0} mine", "{0} mines");
    msgDiv.innerText = txt;
  }

  _addMenuItemMineFlush(pMenu, pMinionId) {
    pMenu.addMenuItem("Flush...", function(pClickEvent) {
      this.runCommand(pClickEvent, pMinionId, "mine.flush");
    }.bind(this));
  }

  _addMenuItemMineDelete(pMenu, pMinionId, key) {
    pMenu.addMenuItem("Delete&nbsp;key...", function(pClickEvent) {
      this.runCommand(pClickEvent, pMinionId, "mine.delete \"" + key + "\"");
    }.bind(this));
  }
}
