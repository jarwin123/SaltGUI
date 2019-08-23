import {Documentation} from '../Documentation.js';
import {DropDownMenu} from '../DropDown.js';
import {Output} from '../output/Output.js';
import {ParseCommandLine} from '../ParseCommandLine.js';
import {Route} from './Route.js';
import {RunType} from '../RunType.js';
import {TargetType} from '../TargetType.js';

export class CmdRoute extends Route {

  constructor(pRouter) {
    super("^[\/]cmd$", "Cmd", "#page-cmd", "", pRouter);

    this._getRunParams = this._getRunParams.bind(this);
    this._onRunReturn = this._onRunReturn.bind(this);
    this._onRun = this._onRun.bind(this);
    this._addKeyEventListener = this._addKeyEventListener.bind(this);

    RunType.createMenu();
    TargetType.createMenu();
  }

  onShow() {
    const myThis = this;

    const titleElement = this.pageElement.querySelector("#template-menu-here");
    const menu = new DropDownMenu(titleElement);
    let templatesText = window.localStorage.getItem("templates");
    if(!templatesText || templatesText === "undefined") templatesText = "{}";
    const templates = JSON.parse(templatesText);
    const keys = Object.keys(templates).sort();
    for(const key of keys) {
      const template = templates[key];
      let description = template["description"];
      if(!description) description = "(" + key + ")";
      menu.addMenuItem(
        description,
        function() {
          myThis._applyTemplate(template);
        }
      );
    }

    const targetField = this.pageElement.querySelector("#target");
    TargetType.autoSelectTargetType(targetField.value);
    this._addKeyEventListener("#target", pKeyboardEvent => {
      const targetType = targetField.value;
      TargetType.autoSelectTargetType(targetType);
    });

    const commandField = this.pageElement.querySelector("#command");

    const cmdbox = this.pageElement.querySelector("#cmd-box");
    this.cmdmenu = new DropDownMenu(cmdbox);
    this._addKeyEventListener("#command", this.cmdmenu.verifyAll);
    this.documentation = new Documentation(this);

    this.pageElement.querySelector("input[type='submit']")
      .addEventListener("click", this._onRun);

    RunType.setRunTypeDefault();

    const outputField = this.pageElement.querySelector("pre");
    outputField.innerText = "Waiting for command...";

    // (re-)populate the dropdown box
    const targetList = document.getElementById("data-list-target");
    while(targetList.firstChild) {
      targetList.removeChild(targetList.firstChild);
    }
    const nodeGroups = JSON.parse(window.localStorage.getItem("nodegroups"));
    if(nodeGroups) {
      for(const nodeGroup of Object.keys(nodeGroups).sort()) {
        const option = document.createElement("option");
        option.value = "#" + nodeGroup;
        targetList.appendChild(option);
      }
    }
    const minions = JSON.parse(window.localStorage.getItem("minions"));
    if(minions) {
      for(const minionId of minions.sort()) {
        const option = document.createElement("option");
        option.value = minionId;
        targetList.appendChild(option);
      }
    }

    // give another field (which does not have a list) focus first
    // because when a field gets focus 2 times in a row,
    // the dropdown box opens, and we don't want that...
    commandField.focus();
    targetField.focus();
  }

  _addKeyEventListener(selector, func) {
    // keydown is too early, keypress also does not work
    const field = this.pageElement.querySelector(selector);
    field.addEventListener("keyup", func);
    // cut/paste do not work everywhere
    field.addEventListener("cut", func);
    field.addEventListener("paste", func);
    // blur/focus should not be needed but are a valuable fallback
    field.addEventListener("blur", func);
    field.addEventListener("focus", func);
  }
  _applyTemplate(template) {

    if(template.targettype) {
      let targetType = template.targettype;
      const targetbox = this.pageElement.querySelector("#target-box");
      // show the extended selection controls when
      targetbox.style.display = "inherit";
      if(targetType !== "glob" && targetType !== "list" && targetType !== "compound" && targetType !== "nodegroup") {
        // we don't support that, revert to standard (not default)
        targetType = "glob";
      }
      this.targetType.setTargetType(targetType);
    } else {
      // not in the template, revert to default
      this.targetType.setTargetTypeDefault();
    }

    if(template.target) {
      const targetField = this.pageElement.querySelector("#target");
      targetField.value = template.target;
    }

    if(template.command) {
      const commandField = this.pageElement.querySelector("#command");
      commandField.value = template.command;
    }
  }

  _onRunReturn(pResponse, pCommand) {
    const outputContainer = this.pageElement.querySelector("pre");
    let minions = Object.keys(pResponse);
    if(pCommand.startsWith("runners.")) minions = ["RUNNER"];
    if(pCommand.startsWith("wheel.")) minions = ["WHEEL"];
    // do not suppress the jobId (even when we can)
    Output.addResponseOutput(outputContainer, null, minions, pResponse, pCommand, "done");
    const button = this.pageElement.querySelector("input[type='submit']");
    button.disabled = false;
  }

  _showError(pMessage) {
    this._onRunReturn("ERROR:\n\n" + pMessage, "");
  }

  _onRun() {
    const button = this.pageElement.querySelector("input[type='submit']");
    if(button.disabled) return;
    const output = this.pageElement.querySelector("pre");

    const targetField = this.pageElement.querySelector("#target");
    const targetValue = targetField.value;
    const commandField = this.pageElement.querySelector("#command");
    const commandValue = commandField.value;

    const targetType = TargetType.menuTargetType._value;

    const func = this._getRunParams(targetType, targetValue, commandValue);
    if(func === null) return;

    button.disabled = true;
    output.innerText = "Loading...";

    func.then(pResponse => {
      if(pResponse) this._onRunReturn(pResponse.return[0], commandValue);
      else this._showError("null response");
    }, pResponse => {
      this._showError(JSON.stringify(pResponse));
    });
  }

  _getRunParams(pTargetType, pTarget, pToRun) {

    // The leading # was used to indicate a nodegroup
    if(pTargetType === "nodegroup" && pTarget.startsWith("#")) {
      pTarget = pTarget.substring(1);
    }

    if(pToRun === "") {
      this._showError("'Command' field cannot be empty");
      return null;
    }

    // collection for unnamed parameters
    const argsArray = [ ];

    // collection for named parameters
    const argsObject = { };

    const ret = ParseCommandLine.parseCommandLine(pToRun, argsArray, argsObject);
    if(ret !== null) {
      // that is an error message being returned
      this._showError(ret);
      return null;
    }

    if(argsArray.length === 0) {
      this._showError("First (unnamed) parameter is the function name, it is mandatory");
      return null;
    }

    const functionToRun = argsArray.shift();

    if(typeof functionToRun !== "string") {
      this._showError("First (unnamed) parameter is the function name, it must be a string, not a " + typeof functionToRun);
      return null;
    }

    // RUNNERS commands do not have a target (MASTER is the target)
    // WHEEL commands also do not have a target
    // but we use the TARGET value to form the usually required MATCH parameter
    // therefore for WHEEL commands it is still required
    if(pTarget === "" && functionToRun !== "runners" && !functionToRun.startsWith("runners.")) {
      this._showError("'Target' field cannot be empty");
      return null;
    }

    // SALT API returns a 500-InternalServerError when it hits an unknown group
    // Let's improve on that
    if(pTargetType === "nodegroup") {
      const nodeGroups = JSON.parse(window.localStorage.getItem("nodegroups"));
      if(!nodeGroups || !(pTarget in nodeGroups)) {
        this._showError("Unknown nodegroup '" + pTarget + "'");
        return null;
      }
    }

    let params = { };
    if(functionToRun.startsWith("runners.")) {
      params = argsObject;
      params.client = "runner";
      // use only the part after "runners." (8 chars)
      params.fun = functionToRun.substring(8);
      if(argsArray.length > 0) params.arg = argsArray;
    } else if(functionToRun.startsWith("wheel.")) {
      // wheel.key functions are treated slightly different
      // we re-use the "target" field to fill the parameter "match"
      // as used by the salt.wheel.key functions
      params = argsObject;
      params.client = "wheel";
      // use only the part after "wheel." (6 chars)
      params.fun = functionToRun.substring(6);
      params.match = pTarget;
    } else {
      params.client = "local";
      params.fun = functionToRun;
      params.tgt = pTarget;
      if(pTargetType) params.tgt_type = pTargetType;
      if(argsArray.length !== 0) params.arg = argsArray;
      if(Object.keys(argsObject).length > 0) params.kwarg = argsObject;
    }

    const runType = RunType.getRunType();
    if(params.client === "local" && runType === "async") {
      params.client = "local_async";
      // return looks like:
      // { "jid": "20180718173942195461", "minions": [ ... ] }
    }

    return this.router.api.apiRequest("POST", "/", params);
  }
}
