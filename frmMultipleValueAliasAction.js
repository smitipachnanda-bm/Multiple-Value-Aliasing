import { Modal, Button } from "antd";
import React, { Component } from "react";
import {
  Configuration,
  MandatoryFormFields,
  getDataTable,
  arrUnique,
} from "../../Configuration";
import "../../ORDER/OrderMaster/style.css";
import AutoCompleteInput from "../../Actions/Controls/AutoComplete/autoComplete";
import AutoCompleteCascad from "../../Actions/Controls/AutoComplete/autoComplete.cascad";
import Swal, { swal } from "sweetalert2/dist/sweetalert2.js";
import { Spin } from "antd";
import "sweetalert2/src/sweetalert2.scss";

export default class frmMultipleValueAliasAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal1Visible: false,
      modal2Visible: false,
      loading1: false,
      AID: "",
      ANAME: "",
      dvalue: "",
      portalid: "",
      pattribute: "",
      dtnew: "",
      templateid:0
    };
  }
  async componentDidMount() {
    let data = this.props.dt;
    if (data["#AttributeID"] !== null) {
      this.setState({
        dtnew: data,
        AID: data["#AttributeID"],
        ANAME: data.AttributeName,
        dvalue: data["Portal Value"],
        portalid: data["#portalID"],
        pattribute: data["Portal Attribute"],
        templateid: data['#ConsolidatedTemplate']
      });
    } else {
      this.setState({
        dtnew: data,
        dvalue: data["Portal Value"],
        portalid: data["#portalID"],
        pattribute: data["Portal Attribute"],
        templateid: data['#ConsolidatedTemplate']
      });
    }
  }

  onAfterSelect(selectedOptions, id, name, index = 0) {
    if (selectedOptions.length > 0) {
      this.setState({
        [id]: selectedOptions[0].DisplayId,
        [name]: selectedOptions[0].DisplayName,
      });
    } else {
      this.setState({
        [id]: "",
        [name]: "",
      });
    }
  }

  setModal1Visible(modal1Visible) {
    this.setState({ modal1Visible });
  }
  setModal2Visible(modal2Visible) {
    this.setState({ modal2Visible, adata: [], ImageData: [], Pid1: [] });
  }
  myChangeHandler = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  async UpdateAliasing() {
    let dttopss = this.state.dtnew;
    let MandatoryArray = [
      { Value: this.state.AVID },
      { Portal: this.state.portalid },
      { "Alias Value": this.state.dvalue },
    ];
    let check = MandatoryFormFields(MandatoryArray);
    if (check == false) {
      return false;
    }

    var que0 =
      "SELECT PortalName FROM Portals WHERE (PID = " +
      this.state.portalid +
      ")";
    let rs0 = await getDataTable(que0);


    debugger;
    var Que =
      "EXEC SaveAttributeValue_MultipleAlias @ValueID=" +
      this.state.AVID +
      ", @portalID='" +
      rs0[0].PortalName +
      "' , @loginID=" +
      Configuration.USER_ID +
      ", @aliasName='" +
      this.state.dvalue +
      "' , @Header='" +
      dttopss["Portal Attribute"] +
      "'";
      Que += " , @templateID ='" + this.props.dt['#ConsolidatedTemplate']+"'"
    let rs = await getDataTable(Que);
    if (rs.length > 0) {
      Swal.fire({
        icon: "success",
        title: "Updated Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      dttopss["#valueID"] = this.state.AVID;
      dttopss["Value"] = this.state.AVALUE;
      dttopss["#AttributeID"] = this.state.AID;
      dttopss["AttributeName"] = this.state.ANAME;
      //dttopss['AliasName'] = this.state.pattribute
      dttopss["AliasValue"] = this.state.dvalue;
      this.props.ChngFn(dttopss);
      await this.setModal2Visible(false);
    } else {
      Swal.fire({
        icon: "info",
        title: "Some Error Occured",
        showConfirmButton: false,
        timer: 1500,
      });
      return false;
    }
  }

  async UpdateReverseAliasing() {
    let dttopss = this.state.dtnew
    let MandatoryArray = [
        { "Value": this.state.PAVALUE },
        { "Portal": this.state.portalid }
    ]
    let check = MandatoryFormFields(MandatoryArray);
    if (check == false) {
        return false;
    }
    var que0 = "SELECT PortalName FROM Portals WHERE (PID = " + this.state.portalid + ")"
    let rs0 = await getDataTable(que0)
    var Que = "EXEC SaveAttributeValue_Alias @ValueID=" + dttopss['#valueID'] + ", @portalID='" + rs0[0].PortalName + "' , @loginID=" + Configuration.USER_ID + ", @aliasName='" + this.state.PAVALUE + "' , @Header='" + this.state.PANAME + "'"
    Que += " , @templateID =" + this.props.templateid
    let rs = await getDataTable(Que)
    if (rs.length > 0) {
        Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            showConfirmButton: false,
            timer: 1500
        })

        dttopss['AliasValue'] = this.state.PAVALUE
        dttopss['Portal Attribute'] = this.state.PANAME
        dttopss['Portal Value'] = this.state.PAVALUE
        this.props.ChngFn(dttopss)
        await this.setModal2Visible(false)
    }
    else {
        Swal.fire({
            icon: 'info',
            title: 'Some Error Occured',
            showConfirmButton: false,
            timer: 1500
        })
        return false;
    }


}

  async SaveAttributeWithMap() {}

  render() {
    return (
      <div style={{ display: "inline" }}>
        <i
          className="fa fa-plus"
          onClick={() => this.setModal2Visible(true)}
          style={{ color: "blue" }}
        ></i>
        <Modal
          icon="info"
          title="Attribute Values Aliasing"
          width={"900px"}
          visible={this.state.modal2Visible}
          onOk={() => this.setModal2Visible(false)}
          onCancel={() => this.setModal2Visible(false)}
          destroyOnClose={false}
          maskClosable={true}
          footer={null}
        >
          <div className="row">
            {this.props.rvrs === 0 && (
              <div className="col-xs-12 col-sm-12 col-md-12 margintop">
                <div className="col-xs-6 col-sm-6 col-md-5 margintop">
                  <label>Attribute Name</label>
                  <div className="form-group">
                    <input
                      className="form-control"
                      name="dAttribute"
                      defaultValue={this.state.dAttribute}
                      value={this.state.dAttribute}
                      onChange={this.myChangeHandler.bind(this)}
                    ></input>
                  </div>
                </div>
                <div className="col-xs-4 col-sm-4 col-md-2 margintop">
                  <label>&nbsp;</label>
                  <div className="form-group">
                    <input
                      type="button"
                      value="Save"
                      onClick={this.SaveAttributeWithMap.bind(this)}
                      className="btn btn-block btn-primary"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="col-xs-12 col-sm-12 col-md-12 margintop">
              {this.props.rvrs === 0 && (
                <div>
                  <div className="col-xs-6 col-sm-6 col-md-3 margintop">
                    <label>Portal Value</label>
                    <div className="form-group">
                      <input
                        className="form-control"
                        name="dvalue"
                        readOnly
                        defaultValue={this.state.dvalue}
                        value={this.state.dvalue}
                      ></input>
                    </div>
                  </div>

                  <div className="col-xs-6 col-sm-6 col-md-3 margintop">
                    <label>Select Attribute</label>
                    <span className="vcode">*</span>
                    <AutoCompleteInput
                      id="AttribiteID"
                      frmNm="FRMVALUEALISINGACTION"
                      quryNm="FILLATTRIBUTE"
                      db="IMAGEDB"
                      filter1="s.CatID"
                      filterId1={this.props.dt["#BlockID"]}
                      filter2=""
                      filterId2=""
                      placeholder="Please Select Attribute"
                      onAfterSelect={(e) =>
                        this.onAfterSelect(e, "AID", "ANAME")
                      }
                      defaultSelected={[
                        {
                          DisplayId: this.state.AID,
                          DisplayName: this.state.ANAME,
                        },
                      ]}
                    ></AutoCompleteInput>
                  </div>
                  <div className="col-xs-4 col-sm-4 col-md-3 margintop">
                    <label>Select Value</label>
                    <span className="vcode">*</span>
                    <AutoCompleteCascad
                      id="tempID"
                      frmNm="FRMVALUEMAPPING"
                      quryNm="FILLVALUES"
                      db="IMAGEDB"
                      filter1="AtrributeID"
                      filterId1={this.state.AID}
                      filter2="BlockID"
                      filterId2={this.props.dt["#BlockID"]}
                      placeholder="Please Select Value"
                      onAfterSelect={(e) =>
                        this.onAfterSelect(e, "AVID", "AVALUE")
                      }
                    ></AutoCompleteCascad>
                  </div>
                </div>
              )}
              {this.props.rvrs === 1 && (
                <div>
                  <div className="col-xs-6 col-sm-6 col-md-3 margintop">
                    <label>Select Attribute</label>
                    <span className="vcode">*</span>
                    <AutoCompleteCascad
                      id="AttribiteID"
                      frmNm="FRMMULTIPLEVALUEACTION"
                      quryNm="FILLPORALHEADER"
                      db="IMAGEDB"
                      filter1="TemplateID"
                      filterId1={this.state. templateid}
                      filter2=""
                      filterId2=""
                      placeholder="Please Select Attribute"
                      onAfterSelect={(e) =>
                        this.onAfterSelect(e, "PAID", "PANAME")
                      }
                    ></AutoCompleteCascad>
                  </div>
                  <div className="col-xs-4 col-sm-4 col-md-3 margintop">
                    <label>Select Value</label>
                    <span className="vcode">*</span>
                    <AutoCompleteCascad
                      id="tempID"
                      frmNm="FRMMULTIPLEVALUEACTION"
                      quryNm="FILLPORTALVALUE"
                      db="IMAGEDB"
                      filter1="[Portal Attribute]"
                      filterId1={this.state.PANAME}
                     
                      filter2="TemplateID"
                      filterId2={this.state. templateid}
                      placeholder="Please Select Value"
                      onAfterSelect={(e) =>
                        this.onAfterSelect(e, "PAVID", "PAVALUE")
                      }
                    ></AutoCompleteCascad>
                  </div>
                </div>
              )}
              <div className="col-xs-4 col-sm-4 col-md-1 margintop">
                <label>&nbsp;</label>
                <div className="form-group">
                  <input
                    type="button"
                    value="Alias"
                    onClick={this.UpdateAliasing.bind(this)}
                    className="btn btn-block btn-primary"
                  />
                </div>
              </div>
              {/* {
                                this.props.rvrs === 0 &&
                                <div className="col-xs-4 col-sm-4 col-md-1 margintop">
                                    <label>&nbsp;</label>
                                    <div className="form-group">
                                        <input type='button' value='Add' onClick={this.AddValue.bind(this)} className='btn btn-block btn-success' />
                                    </div>
                                </div>
                            }
                            {this.state.AVID !== '' && this.state.AVID !== undefined && this.props.rvrs === 0 &&

                                <div className="col-xs-4 col-sm-4 col-md-1 margintop">
                                    <label>&nbsp;</label>
                                    <div className="form-group">
                                        <input type='button' value='Delete' onClick={this.DeleteValue.bind(this)} className='btn btn-block btn-danger' />
                                    </div>
                                </div>
                            }
                           {
                                this.props.rvrs === 1 &&
                                <div className="col-xs-4 col-sm-4 col-md-5 margintop">
                                    <label>&nbsp;</label>
                                    <div>
                                    <label>Attribute Name - <span className='vcode'>{this.state.dtnew['AttributeName']}</span></label><br></br>
                                    <label>Attribute Value - <span className='vcode'>{this.state.dtnew['Value']}</span></label>
                                    </div>
                                </div>
                            } */}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
