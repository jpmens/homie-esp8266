'use strict';

import React from 'react';

export default class WifiStep extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      networks: {},
      buttonDisabled: true,
      selectedSsid: null,
      showSsidInput: false,
      showPasswordInput: false,
      showPassword: false
    };
  }

  componentDidMount () {
    let interval;
    let done = false;
    let networks = () => {
      window.fetch(`${this.props.baseApi}/networks`).then((res) => {
        if (res.ok && !done) {
          done = true;
          window.clearInterval(interval);
          return res.json();
        }
      }).then((json) => {
        this.setState({
          loading: false,
          networks: json
        });
      });
    };

    interval = window.setInterval(networks, 5 * 1000);
    networks();
  }

  handleSelectChange (e) {
    if (e.target.value === 'select') {
      this.setState({ showSsidInput: false, showPasswordInput: false, selectedSsid: null, buttonDisabled: true });
    } else if (e.target.value === 'other') {
      this.setState({ showSsidInput: true, showPasswordInput: true, selectedSsid: null, buttonDisabled: false });
    } else {
      let data = e.target.options[e.target.selectedIndex].dataset;
      this.setState({ showSsidInput: false, showPasswordInput: data.open === 'no', selectedSsid: data.ssid, buttonDisabled: false });
    }
  }

  handleHiddenChange (e) {
    this.setState({ showPassword: e.target.checked });
  }

  handleFormSubmit (e) {
    e.preventDefault();

    let creds = {};

    if (this.state.selectedSsid) {
      creds.ssid = this.state.selectedSsid;
    } else {
      creds.ssid = this.refs.ssid.value;
    }
    creds.password = this.refs.password.value;

    this.props.setWifiCreds(creds);
    this.props.nextStep();
  }

  render () {
    return (
      <div>
        {(() => {
          if (this.state.loading) {
            return (
              <div className='notification is-info'>
                <span className='button is-info is-loading'>Loading</span>
                Gathering available networks...
              </div>
            );
          } else {
            this.state.networks.networks.sort(function (networkA, networkB) {
              if (networkA.rssi > networkB.rssi) {
                return -1;
              } else if (networkA.rssi < networkB.rssi) {
                return 1;
              } else {
                return 0;
              }
            });

            let networks = this.state.networks.networks.map(function (network) {
              if (network.rssi <= -100) {
                network.signalQuality = 0;
              } else if (network.rssi >= -50) {
                network.signalQuality = 100;
              } else {
                network.signalQuality = 2 * (network.rssi + 100);
              }

              switch (network.encryption) {
                case 'wep':
                  network.encryption = 'WEP';
                  break;
                case 'wpa':
                  network.encryption = 'WPA';
                  break;
                case 'wpa2':
                  network.encryption = 'WPA2';
                  break;
                case 'none':
                  network.encryption = 'Open';
                  break;
                case 'auto':
                  network.encryption = 'Automatic';
                  break;
              }
              return network;
            });

            return (
              <div className='content'>
                <p>
                  Select the Wi-Fi network to connect to:
                </p>

                <form onSubmit={ (e) => this.handleFormSubmit(e) }>
                  <p className='control'>
                    <span className='select'>
                      <select ref='select' onChange={ (e) => { this.handleSelectChange(e); } }>
                        <option value='select' key='select'>Select a network...</option>
                        { networks.map((network, i) => {
                          return (
                            <option value={i} data-ssid={ network.ssid } data-open={ network.encryption === 'Open' ? 'yes' : 'no' } onSelect={ (e) => { window.alert(network.ssid); } } key={i}>
                              { network.ssid } - { network.encryption } ({ network.signalQuality }%)
                            </option>
                          );
                        }) }

                        <option value='other' key='other'>Other/Hidden network</option>
                      </select>
                    </span>
                  </p>

                  {(() => {
                    if (this.state.showSsidInput) {
                      return (
                        <p className='control'>
                          <input ref='ssid' className='input' type='text' placeholder='Network SSID' maxLength='32' required />
                        </p>
                      );
                    }
                  })()}

                  {(() => {
                    if (this.state.showPasswordInput) {
                      return (
                        <div>
                          <p className='control'>
                            <input ref='password' className='input' type={ this.state.showPassword ? 'text' : 'password' } placeholder='Network password (leave blank if open network)' />
                          </p>

                          <p className='control'>
                            <label className='checkbox'>
                              <input type='checkbox' onChange={ (e) => this.handleHiddenChange(e) } />
                              Show password
                            </label>
                          </p>
                        </div>
                      );
                    }
                  })()}

                  <p className='control'>
                    <button type='submit' disabled={ this.state.buttonDisabled } className='button is-primary'>Next</button>
                  </p>
                </form>
              </div>
            );
          }
        })()}
      </div>
    );
  }
}
WifiStep.propTypes = {
  baseApi: React.PropTypes.string.isRequired,
  nextStep: React.PropTypes.func.isRequired,
  setWifiCreds: React.PropTypes.func.isRequired
};
