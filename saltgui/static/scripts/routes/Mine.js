import {DropDownMenu} from '../DropDown.js';
import {Output} from '../output/Output.js';
import {PageRoute} from './Page.js';
import {Route} from './Route.js';
import {Utils} from '../Utils.js';

export class MineRoute extends PageRoute {

  constructor(pRouter) {
    super("mine", "Mine", "#page-mine", "#button-mine", pRouter);

    this._handleMineWheelKeyListAll = this._handleMineWheelKeyListAll.bind(this);
    this.updateMinion = this.updateMinion.bind(this);

    Utils.makeTableSortable(this.getPageElement());
    Utils.makeTableSearchable(this.getPageElement());
  }

  onShow() {
    const myThis = this;

    const wheelKeyListAllPromise = this.router.api.getWheelKeyListAll();
    const localMineValidPromise = this.router.api.getLocalMineValid();
    const runnerJobsListJobsPromise = this.router.api.getRunnerJobsListJobs();
    const runnerJobsActivePromise = this.router.api.getRunnerJobsActive();

    wheelKeyListAllPromise.then(pWheelKeyListAllData => {
      myThis._handleMineWheelKeyListAll(pWheelKeyListAllData);

      localMineValidPromise.then(pLocalMineValidData => {
        myThis.updateMinions(pLocalMineValidData);
      }, pLocalMineValidMsg => {
        const localMineValidData = {"return":[{}]};
        for(const k of pWheelKeyListAllData.return[0].data.return.minions)
          localMineValidData.return[0][k] = JSON.stringify(pLocalMineValidMsg);
        myThis.updateMinions(localMineValidData);
      });
    }, pWheelKeyListAllMsg => {
      myThis._handleMineWheelKeyListAll(JSON.stringify(pWheelKeyListAllMsg));
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
  }

  _handleMineWheelKeyListAll(pWheelKeyListAllData) {
    const table = this.getPageElement().querySelector('#minions');

    if(PageRoute.showErrorRowInstead(table, pWheelKeyListAllData)) return;

    const keys = pWheelKeyListAllData.return[0].data.return;

    const minionIds = keys.minions.sort();
    for(const minionId of minionIds) {
      this.addMinion(table, minionId, 1);

      // preliminary dropdown menu
      const minionTr = table.querySelector("#" + Utils.getIdFromMinionId(minionId));
      const menu = new DropDownMenu(minionTr);
      this._addMenuValidhowMine(menu, minionId);

      minionTr.addEventListener("click", pClickEvent =>
        window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(minionId))
      );
    }

    const msgDiv = this.pageElement.querySelector("div.minion-list .msg");
    const txt = Utils.txtZeroOneMany(minionIds.length,
      "No minions", "{0} minion", "{0} minions");
    msgDiv.innerText = txt;
  }

  updateOfflineMinion(pContainer, pMinionId, pMinionsDict) {
    super.updateOfflineMinion(pContainer, pMinionId, pMinionsDict);

    const minionTr = pContainer.querySelector("#" + Utils.getIdFromMinionId(pMinionId));

    // force same columns on all rows
    minionTr.appendChild(Route.createTd("mineinfo", ""));
    minionTr.appendChild(Route.createTd("run-command-button", ""));
  }

  updateMinion(pContainer, pMinionData, pMinionId, pAllMinionsMine) {
    super.updateMinion(pContainer, null, pMinionId, pAllMinionsMine);

    const minionTr = pContainer.querySelector("#" + Utils.getIdFromMinionId(pMinionId));

    if(pMinionData === null) {
      const mineInfoText = "no mines";
      const mineInfoTd = Route.createTd("mineinfo", mineInfoText);
      mineInfoTd.setAttribute("sorttable_customkey", 0);
      minionTr.appendChild(mineInfoTd);
    } else if(typeof pMinionData === "object") {
      const cnt = Object.keys(pMinionData).length;
      const mineInfoText = Utils.txtZeroOneMany(cnt, "no mines", "{0} mine", "{0} mines");
      const mineInfoTd = Route.createTd("mineinfo", mineInfoText);
      mineInfoTd.setAttribute("sorttable_customkey", cnt);
      minionTr.appendChild(mineInfoTd);
    } else {
      const mineInfoTd = Route.createTd("", "");
      Utils.addErrorToTableCell(mineInfoTd, pMinionData);
      minionTr.appendChild(mineInfoTd);
    }

    const menu = new DropDownMenu(minionTr);
    this._addMenuValidhowMine(menu, pMinionId);

    minionTr.addEventListener("click", pClickEvent =>
      window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(pMinionId))
    );
  }

  _addMenuValidhowMine(pMenu, pMinionId) {
    pMenu.addMenuItem("Show&nbsp;mine", function(pClickEvent) {
      window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(pMinionId));
    }.bind(this));
  }
}
