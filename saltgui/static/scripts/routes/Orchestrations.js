import {DropDownMenu} from '../DropDown.js';
import {PageRoute} from './Page.js';
import {Route} from './Route.js';
import {Utils} from '../Utils.js';

export class OrchestrationsRoute extends PageRoute {

  constructor(pRouter) {
    super("orchestrations", "Orchestrations", "#page-orchestrations", "#button-orchestrations", pRouter);

	  //state.orchestrate_show_sls
    this._handleOrchestrationsStateOrchestrateShowSls = this._handleOrchestrationsStateOrchestrateShowSls.bind(this);

    Utils.makeTableSortable(this.getPageElement());
    Utils.makeTableSearchable(this.getPageElement());
  }

  onShow() {
    const myThis = this;

    const runnerStateOrchestrateShowSlsPromise = this.router.api.getRunnerStateOrchestrateShowSls();
    const runnerJobsListJobsPromise = this.router.api.getRunnerJobsListJobs();
    const runnerJobsActivePromise = this.router.api.getRunnerJobsActive();

    runnerStateOrchestrateShowSlsPromise.then(pStateOrchestrateShowSlsData => {
      myThis._handleOrchestrationsStateOrchestrateShowSls(pStateOrchestrateShowSlsData);
    }, pStateOrchestrateShowSlsMsg => {
      myThis._handleOrchestrationsStateOrchestrateShowSls(JSON.stringify(pStateOrchestrateShowSlsMsg));
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

  _handleOrchestrationsStateOrchestrateShowSls(pStateOrchestrateShowSlsData) {
    const container = this.getPageElement().querySelector(".orchestrations");

    if(PageRoute.showErrorRowInstead(container, pStateOrchestrateShowSlsData)) return;

    // should we update it or just use from cache (see commandbox) ?
    let orchestrations = pStateOrchestrateShowSlsData.return[0];
    if(!orchestrations) orchestrations = {"dummy":{}};
    orchestrations = orchestrations[Object.keys(orchestrations)[0]];
    if(!orchestrations) orchestrations = {};
    window.sessionStorage.setItem("orchestrations", JSON.stringify(orchestrations));
    const keys = Object.keys(orchestrations).sort();
    for(const key of keys) {
      const orchestration = orchestrations[key];
      this._addOrchestration(container, key, orchestration);
    }

    const msgDiv = this.pageElement.querySelector("div.orchestrations-list .msg");
    const txt = Utils.txtZeroOneMany(keys.length,
      "No orchestrations", "{0} orchestration", "{0} orchestrations");
    msgDiv.innerText = txt;
  }

  _addOrchestration(pContainer, pOrchestrationName, orchestration) {
    const tr = document.createElement("tr");

    tr.appendChild(Route.createTd("name", pOrchestrationName));

    // calculate description
    const description = orchestration["description"];
    if(!description) {
      tr.appendChild(Route.createTd("description value-none", "(none)"));
    } else {
      tr.appendChild(Route.createTd("description", description));
    }

    // calculate targettype
    const targetType = orchestration["targettype"];
    // calculate target
    const target = orchestration["target"];
    if(!targetType && !target) {
      tr.appendChild(Route.createTd("target value-none", "(none)"));
    } else if(/* targetType && */ !target) {
      tr.appendChild(Route.createTd("target", targetType));
    } else if(!targetType /* && target */) {
      tr.appendChild(Route.createTd("target", target));
    } else {
      tr.appendChild(Route.createTd("target", targetType + " " + target));
    }

    // calculate command
    const command = orchestration["command"];
    if(!command) {
      tr.appendChild(Route.createTd("command value-none", "(none)"));
    } else {
      tr.appendChild(Route.createTd("command", command));
    }

    const menu = new DropDownMenu(tr);
    this._addMenuItemApplyOrchestration(menu, targetType, target, command);

    pContainer.tBodies[0].appendChild(tr);

    tr.addEventListener("click", pClickEvent =>
      this.runFullCommand(pClickEvent, "", "", "runners.state.orchestrate " + pOrchestrationName)
    );
  }

  _addMenuItemApplyOrchestration(pMenu, pTargetType, target, pCommand) {
    pMenu.addMenuItem("Apply&nbsp;orchestration...", function(pClickEvent) {
      this.runFullCommand(pClickEvent, "", "", "runners.state.orchestrate " + pOrchestrationName)
    }.bind(this));
  }
}
