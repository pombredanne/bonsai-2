/*
 * @flow
 */

import type {RawStats} from '../types/Stats';

import './css/App.css';

import DataFilePicker from './DataFilePicker';
import FilePicker from './FilePicker';
import HowTo from './HowTo';
import React, { Component } from 'react';
import Stats from './Stats';

type State = {
  dataFiles: Array<string>,
  loading: boolean,
  stats: ?{
    file: string,
    raw: RawStats,
  },
};

export default class App extends Component<void, void, State> {
  state: State = {
    dataFiles: [],
    loading: false,
    stats: null,
  };

  render() {
    return (
      <div className="App">
        <h1>Webpack Dependency Size</h1>
        <div>
          Existing data file:&nbsp;
          <DataFilePicker
            onLoading={this.onLoading}
            onChange={this.onDataFilePicked}
          />
          &nbsp;or&nbsp;
          <FilePicker
            onLoading={this.onLoading}
            onChange={this.onFileUploaded}
          />
        </div>

        {this.state.loading ? <p><em>Loading...</em></p> : null}
        {this.state.stats ? <Stats stats={this.state.stats} /> : <HowTo />}
      </div>
    );
  }

  onLoading = () => {
    this.setState({
      loading: true,
    });
  };

  onFileUploaded = (fileName: string, fileText: string) => {
    this.setState({
      loading: false,
      stats: {
        file: fileName,
        raw: JSON.parse(fileText),
      },
    });
  };

  onDataFilePicked = (fileName: string, json: Object) => {
    this.setState({
      loading: false,
      stats: {
        file: fileName,
        raw: json,
      },
    });
  };
}