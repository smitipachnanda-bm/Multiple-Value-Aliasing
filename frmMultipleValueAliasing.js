import React, { Component } from "react";
import {
  Configuration,
  exceltodb,
  MandatoryFormFields,
  getDataTable,
  json2xlsx,
  SaveTemplateFile,
} from "../Configuration";
import AntD from "../Actions/Controls/Table/AntDTable";
import { Spin, Modal } from "antd";
import "../ORDER/OrderMaster/style.css";
import "antd/dist/antd.css";
import AutoCompleteInput from "../Actions/Controls/AutoComplete/autoComplete";
import AutoCompleteCascad from "../Actions/Controls/AutoComplete/autoComplete.cascad";
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/src/sweetalert2.scss";
import AutoCompletemulti from "../Actions/Controls/AutoComplete/autoCompleteMultipleCascad";

const dataBase = "IMAGEDB";
let files = "";
var tb = "";

export default class FrmMultipleValueAliasing extends Component {
  constructor() {
    super();
    this.state = {
      loginId: 0,
      loading: false,
      adata: [],
      selectedrows: [],
      flupld: false,
      stsdup: 0,
      tempstr: "",
      tempId:[]
    };
  }

  async componentDidMount() {
    let rs = await getDataTable(
      "select orgid from users where userid = " + Configuration.USER_ID
    );
    await this.setState({
      loginId: Configuration.USER_ID,
      orgid: rs[0].orgid,
    });
  }

  myChangeHandler = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  //For selecting one option
  onAfterSelect(selectedOptions, id, name) {
    if (selectedOptions.length > 0) {
      this.setState({
        [id]: selectedOptions[0].DisplayId,
        [name]: selectedOptions[0].DisplayName,
      });
    } else {
      this.setState({
        [id]: "",
        [name]: "",
        adata: [],
      });
    }
  }

   //For selecting multiple option
  async onAutoCOmpletMultiPleSelect(selectedOptions, name) {
    if (selectedOptions.length > 0) {
      this.setState({
        [name]: selectedOptions,
      });
    } else {
      this.setState({
        [name]: "",
      });
    }
  }

  // To get data for value aliasing from database
  async getData() {
    this.setState({
      loading: true,
      adata: [],
    });
    let MandatoryArray = [
      { portal: this.state.portalid },
      { BLOCK: this.state.catid1 },
      { Template: this.state.tempId },
    ];
    let check = MandatoryFormFields(MandatoryArray);
    if (check == false) {
      this.setState({ loading: false, adata: [] });
      return false;
    }

    debugger
    let tmpstr = "";
    for (let index = 0; index < this.state.tempId.length; index++) {
      var element = this.state.tempId[index];
      if (tmpstr === "") {
        tmpstr = element.DisplayId;
      } else {
        tmpstr = tmpstr + "," + element.DisplayId;
      }
    }
    
    this.setState({ tempstr: tmpstr });

    let que1 =
      "EXEC frmValueAliasing_UpdatedGetAliasedData " +
      "  @templateID = '" +
      tmpstr +
      "' , @loginId =" +
      this.state.loginId;

    //debugger
    let rs1 = await getDataTable(que1);

    this.setState({ loading: false, adata: rs1 });
  }

  //To delete row from the data received
  deleteRow(e) {
    let st = this.state.adata;
    this.setState({ adata: [] });
    let index = e.key;
    st.splice(index, 1);

    this.setState({ adata: st });
    this.forceUpdate();
  }

  // For forward Alising
  EditRow(e) {
    // debugger
    console.log(e);
    let index = e.key;
    let st = this.state.adata;
    st[index] = e;
    this.setState({ adata: st });
    if (this.state.selectedrows.length > 0 && this.state.stsdup === 1) {
    }
  }

  // To check if any row is selected
  async selectedDataFN(e) {
    if (e.length > 0) {
      this.setState({ selectedrows: e });
      //   console.log(JSON.stringify(e));
    } else {
      this.setState({ selectedrows: [] });
      // console.log(e);
    }
  }

  // For updating alising in the database
  async UpdateSelectedAliasing() {
    let st = this.state.selectedrows;
    this.setState({ loading: true });

    // st = JSON.stringify(st);

    for (let i = 0; i < st.length; i++) {
      let ele = st[i];
      let quechk =
        "select OptionValueAliasing.UID,TamplateName + ' - ' + PortalHeader + ' - ' + AliasedValue AS DT from OptionValueAliasing inner join TemplateMaster on TemplateMaster.TemplateID = OptionValueAliasing.TemplateID where ValueID = " +
        ele["#valueID"] +
        " and PortalHeader = '" +
        ele["Portal Attribute"] +
        "' and ";
      quechk +=
        "  OptionValueAliasing.TemplateID  IN (" +
        ele["#ConsolidatedTemplate"] +
        ") and ValueID <> 23554";
      let rschk = await getDataTable(quechk);
      if (rschk.length > 0) {
        this.setState({ loading: false });
        let st1 = await Swal.fire({
          title:
            "ALREADY ALISED WITH " +
            rschk[0]["DT"] +
            " . <br> ARE YOU SURE WANT TO OVERWRITE DATA ?",
          showCancelButton: true,
          confirmButtonText: "YES",
          cancelButtonText: "NO",
        });
        if (st1.isConfirmed) {
        } else {
          debugger;
          st.splice(i, 1);

          console.log(st);
        }
      }
    }

    this.setState({ loading: true });
    st = JSON.stringify(st);
    let que11 =
      "EXEC frmMultipleValueAliasing_UpdateSelectedAliasing @dtJSON = '" +
      st +
      "' , @loginID = " +
      this.state.loginId;

    await getDataTable(que11);
    this.setState({ loading: false });

    await this.updateData();
  }

  // For deleting Aliasing
  async DeleteAliasing() {
    let st = this.state.selectedrows;
    this.setState({ loading: true });

    st = JSON.stringify(st);
    //  console.log(st);

    let que11 =
      "frmMultipleValueAliasing_DeleteSelectedAliasing @dtJSON = '" +
      st +
      "' , @loginID = " +
      this.state.loginId;

    //    console.log(que11);
    await getDataTable(que11);
    this.setState({ loading: false });

    await this.updateData();
  }

  // Updating the data once the changes are made (Edit, Delete)
  // Also to check whether to do forward aliasing or reverse aliasing
  async updateData() {
    this.setState({ loading: true, adata: [] });
    let tmpstr = "";
    for (let index = 0; index < this.state.tempId.length; index++) {
      var element = this.state.tempId[index];
      if (tmpstr === "") {
        tmpstr = element.DisplayId;
      } else {
        tmpstr = tmpstr + "," + element.DisplayId;
      }
    }
    debugger;
    if (this.state.stsdup === 0) {
      let que1 =
        "EXEC frmValueAliasing_UpdatedGetAliasedData " +
        "  @templateID = '" +
        tmpstr +
        "' , @loginId =" +
        this.state.loginId;

      //debugger
      let rs1 = await getDataTable(que1);

      this.setState({ loading: false, adata: rs1 });
    }

    if (this.state.stsdup === 1) {
      let que1 =
        "EXEC frmMultipleValueAliasing_GetReverseAliasingData " +
        "  @templateID = '" +
        tmpstr +
        "' , @loginId =" +
        this.state.loginId;
      let rs1 = await getDataTable(que1);

      this.setState({ loading: false, adata: rs1 });
    }
  }

  // To allow reverse aliasing
  async AllowReverse(e) {
    if (e.target.checked === true) {
      this.setState({ stsdup: 1 });
    } else {
      this.setState({ stsdup: 0 });
    }
  }

  // To create reference aliasing
  async UpdateReferenceAlising() {
    let MandatoryArray = [{ "REFERENCE TEMPLATE": this.state.ReftempId }];
    let check = MandatoryFormFields(MandatoryArray);
    if (check == false) {
      return false;
    }
    let st = await Swal.fire({
      title: "ARE YOU SURE WANT TO UPDATE REFERENCE TEMPLATE DATA ?",
      showCancelButton: true,
      confirmButtonText: "YES",
      cancelButtonText: "NO",
    });
    if (st.isConfirmed) {
      this.setState({ loading: true, adata: [] });

      let que2 =
        "EXEC FrmMultipleValueAliasingMaster_UpdateReferenceData  @loginID =" +
        this.state.loginId +
        " , @tempId =" +
        this.state.tempId;
      que2 += " ,  @refTempId =" + this.state.ReftempId;
      let rs2 = await getDataTable(que2);

      await this.updateData();

      // this.setState({ loading: false, aData: rs2 })
    } else {
      return false;
    }
  }

  // Modal(popup) for reference aliasing. Multiple references can be used for single target
  async GetReference(e) {
    Modal.info({
      title: "GET TEMPLATE REFERENCE",
      okText: "CLOSE",
      width: "600px",
      closable: true,
      footer: null,
      bodyStyle: { maxHeight: "500px" },
      style: { padding: "0px" },
      centered: true,
      maskClosable: true,
      content: (
        <div>
          <div className="col-xs-6 col-sm-6 col-md-7 margintop">
            <label>Select Template</label>
            <AutoCompletemulti
              id="catid"
              frmNm="FRMUPDATEATTRIBUTEALIASING"
              quryNm="FILLTEMPLATE"
              db="IMAGEDB"
              filter1="CatID"
              filterId1={this.state.catid1}
              filter2="PortalID"
              filterId2={this.state.portalid}
              placeholder="Please Select Reference Template"
              onAfterSelect={(e) =>
                this.onAutoCOmpletMultiPleSelect(e, "tempId")
              }
              isValid={this.state.isValid}
            ></AutoCompletemulti>
          </div>

          <div className="col-xs-6 col-sm-6 col-md-7 margintop">
            <label>Select Template</label>
            <AutoCompleteCascad
              id="catid"
              frmNm="FRMUPDATEATTRIBUTEALIASING"
              quryNm="FILLTEMPLATE"
              db="IMAGEDB"
              filter1="CatID"
              filterId1={this.state.catid1}
              filter2="PortalID"
              filterId2={this.state.portalid}
              placeholder="Please Select Template"
              onAfterSelect={(e) =>
                this.onAfterSelect(e, "ReftempId", "ReftempName")
              }
              isValid={this.state.isValid}
            ></AutoCompleteCascad>
          </div>
          <div className="col-xs-6 col-sm-6 col-md-4 margintop">
            <label>&nbsp;</label>
            <div className="form-group">
              <input
                type="button"
                value="SAVE"
                onClick={this.UpdateReferenceAlising.bind(this)}
                className="btn btn-block btn-danger"
              />
            </div>
          </div>
        </div>
      ),
    });
  }



  render() {
    return (
      <div className="content-wrapper" style={{ maxHeight: "100%" }}>
        <div
          className="loader"
          style={{ display: this.state.loading ? "block" : "none" }}
        >
          <div className="loader-item">
            <Spin />
          </div>
        </div>
        <section className="content">
          <div
            id="ctl00_CPHMaincontent_div"
            className="box box-success"
            style={{ marginTop: "-13px" }}
          >
            <div className="box-header with-border">
              <h3 className="box-title">Value Aliasing Master</h3>

              <div class="btn-group pull-right">
                <button type="button" class="btn btn-danger">
                  Select Action
                </button>
                <button
                  type="button"
                  class="btn btn-danger dropdown-toggle"
                  data-toggle="dropdown"
                >
                  <span class="caret"></span>
                  <span class="sr-only">Toggle Dropdown</span>
                </button>
                <ul class="dropdown-menu" role="menu">
                  {this.state.adata.length > 0 && (
                    <li>
                      <a onClick={this.GetReference.bind(this)}>
                        GET REFERENCE
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div
            className="box-body"
            id="orderDetails"
            style={{ display: "block" }}
          >
            <div className="row">
              <div className="col-xs-6 col-sm-6 col-md-2 margintop">
                <label>Select Block &nbsp;</label>
                <span className="vcode">*</span>
                <AutoCompleteInput
                  id="catid"
                  frmNm="FRMCATPRODUCTMASTER"
                  quryNm="FILLCAT"
                  db="IMAGEDB"
                  placeholder="Please Select Block"
                  onAfterSelect={(e) =>
                    this.onAfterSelect(e, "catid1", "catname1")
                  }
                  isValid={this.state.isValid}
                ></AutoCompleteInput>
              </div>

              <div className="col-xs-6 col-sm-6 col-md-2 margintop">
                <label>Select Portal &nbsp;</label>
                <span className="vcode">*</span>
                <AutoCompleteInput
                  id="portalid"
                  frmNm="FRMATTRIBUTEALIASE"
                  quryNm="FILLPORTAL"
                  db="IMAGEDB"
                  placeholder="Please Select Portal"
                  onAfterSelect={(e) =>
                    this.onAfterSelect(e, "portalid", "portalname")
                  }
                  isValid={this.state.isValid}
                ></AutoCompleteInput>
              </div>

              <div className="col-xs-6 col-sm-6 col-md-2 margintop">
                <label>Select Template &nbsp;</label>
                <span className="vcode">*</span>
                <AutoCompletemulti
                  id="catid"
                  frmNm="FRMUPDATEATTRIBUTEALIASING"
                  quryNm="FILLTEMPLATE"
                  db="IMAGEDB"
                  filter1="PortalID"
                  filterId1={this.state.portalid}
                  filter2="CatID"
                  filterId2={this.state.catid1}
                  placeholder="Please Select Template"
                  onAfterSelect={(e) =>
                    this.onAutoCOmpletMultiPleSelect(e, "tempId")
                  }
                  isValid={this.state.isValid}
                ></AutoCompletemulti>
              </div>

              {(this.state.portalid !== undefined) &&
              (this.state.tempId.length <=1) &&
              (
                <div className="col-xs-6 col-sm-6 col-md-2 margintop">
                  <label>Upload file</label>
                  <span className="vcode">*</span>
                  <div className="form-group">
                    <input
                      type="file"
                      accept=".xls, .xlsx, .csv"
                      className="form-control"
                      name="fileinput"
                    />
                  </div>
                </div>
              )}

              {(this.state.loginId === "10" ||
                this.state.loginId === "20041") &&
                this.state.adata.length > 0 && (
                  <div className="col-xs-6 col-sm-6 col-md-1 margintop">
                    <label>&nbsp;</label>
                    <span className="vcode">
                      <input
                        type="checkbox"
                        onChange={this.AllowReverse.bind(this)}
                        name="chkonreversealiasing"
                      ></input>
                      <label>Reverse Aliasing</label>
                    </span>
                  </div>
                )}

              <div className="col-xs-6 col-sm-6 col-md-1 margintop">
                <label>&nbsp;</label>
                <div className="form-group">
                  <input
                    type="button"
                    value="Get Data"
                    onClick={this.getData.bind(this)}
                    className="btn btn-block btn-primary"
                  />
                </div>
              </div>

              {this.state.selectedrows.length > 0 && (
                <div className="col-xs-6 col-sm-6 col-md-1 margintop">
                  <label>&nbsp;</label>
                  <div className="form-group">
                    <input
                      type="button"
                      value="Update Aliasing"
                      onClick={this.UpdateSelectedAliasing.bind(this)}
                      className="btn btn-block btn-success"
                    />
                  </div>
                </div>
              )}

              <div className="col-xs-4 col-sm-4 col-md-1 pull-right">
                <div className="form-group">
                  {this.state.adata.length > 0 && (
                    <a
                      id="refrsh"
                      onClick={this.updateData.bind(this)}
                      style={{ color: "red" }}
                    >
                      <span class="fa fa-refresh">Refresh Data</span>
                    </a>
                  )}
                </div>
              </div>

              {(this.state.loginId === "10" ||
                this.state.loginId === "20041") &&
                this.state.selectedrows.length > 0 && (
                  <div className="col-xs-6 col-sm-6 col-md-2 margintop">
                    <label>&nbsp;</label>
                    <div className="form-group">
                      <input
                        type="button"
                        value="Delete Aliasing"
                        onClick={this.DeleteAliasing.bind(this)}
                        className="btn btn-block btn-danger"
                      />
                    </div>
                  </div>
                )}

              <div className="col-xs-12 col-sm-12 col-md-12 margintop">
                {this.state.adata.length > 0 && (
                  <AntD
                    data={[...this.state.adata]}
                    tblname={this.state.tablename}
                    templteID={this.state.tempId}
                    rvrs={this.state.stsdup}
                    Delete="true"
                    DeleteFn={(e) => this.deleteRow(e)}
                    EditBlock="true"
                    EditBlockFn={this.EditRow.bind(this)}
                    selected="true"
                    SelectedFn={(e) => this.selectedDataFN(e)}
                  ></AntD>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
