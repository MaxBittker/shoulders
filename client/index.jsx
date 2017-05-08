import React from "react";
import ReactDOM from "react-dom";
import Request from "browser-request";
import brace from "brace";
import AceEditor from "react-ace";
import "brace/mode/json";
import "brace/theme/github";
import _ from "lodash";

const tickerEntryComponent = (entry, i) => (
  <div key={i}>
    <pre
    >{`${i} ${entry.timestamp} - ${entry.runtime} - ${entry.testType} - ${entry.writeKey} \n${entry.inputJSON}`}</pre>
  </div>
);

class InputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: null,
      ticker: [],
      inputJSON: "{}"
    };
  }
  sendRequest() {
    //send server subset of form state
    let payload = this.state.inputJSON;
    Request(
      {
        method: "POST",
        url: "api/process",
        body: payload,
        json: true
      },
      (err, res, bod) => {
        if (res.status === 200) {
          this.setState({
            ticker: this.state.ticker.concat(bod),
            errorMessage: null
          });
        } else {
          this.setState({ errorMessage: bod });
        }
        if (err) console.error(err);
      }
    );
  }
  isJSONValid() {
    try {
      JSON.parse(this.state.inputJSON);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  render() {
    let valid = this.isJSONValid();
    //build component lists

    let tickerEntries = this.state.ticker.map(tickerEntryComponent).reverse();
    return (
      <div className="app-container">
        <h1> Analytics Simulator </h1>
        <h4> Simulate an API call from any* Segment library.</h4>
        <div className="input-form">
          <div className="input-card col">
            <AceEditor
              className="ace-editor"
              value={this.state.inputJSON}
              mode="json"
              theme="github"
              onChange={v => this.setState({ inputJSON: v })}
              name="jsonEditor"
              editorProps={{ $blockScrolling: Infinity }}
            />
            <button
              disabled={!valid}
              className="submit"
              onClick={this.sendRequest.bind(this)}
            >
              {" "}analyze
            </button>
            <div className="error-message">
              <h4>{this.state.errorMessage}</h4>
            </div>
          </div>
        </div>
        <div className="ticker">
          <h4>
            Successful Events:
          </h4>
          {tickerEntries}
        </div>
      </div>
    );
  }
}
ReactDOM.render(<InputForm />, document.getElementById("app"));
