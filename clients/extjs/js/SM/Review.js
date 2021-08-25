Ext.ns('SM.Review.Form')

SM.Review.Form.ResultCombo = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this
    const config = {
      triggerClass: 'sm-review-trigger',
      disabledClass: 'sm-review-item-disabled',
      width: 100,
      lastSavedData: "",
      cls: 'sm-review-combo-input',
      changed: false,
      fieldLabel: 'Result<i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      emptyText: 'Your result...',
      name: 'result',
      hiddenName: 'result',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['result', 'resultStr'],
        data: [['pass', 'Not a Finding'], ['notapplicable', 'Not Applicable'], ['fail', 'Open']]
      }),
      valueField: 'result',
      displayField: 'resultStr',
      listeners: {
        'render': function (combo) {
          new Ext.ToolTip({
            target: combo.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            html: SM.resultTipText
          })
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ResultCombo.superclass.initComponent.call(this)
  }
})

SM.Review.Form.ResultTextArea = Ext.extend(Ext.form.TextArea, {
  initComponent: function () {
    const _this = this
    const config = {
      cls: 'sm-review-result-textarea',
      anchor: '100% -30',
      lastSavedData: "",
      allowBlank: true,
      emptyText: 'Please address the specific items in the review.',
      fieldLabel: 'Comment<br><i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      autoScroll: 'auto',
      name: 'resultComment',
      enableKeyEvents: true,
      listeners: {
        'render': function (ta) {
          ta.mon( ta.el, 'input', function (e) {
            _this.form.setReviewFormItemStates(_this.form)
          })
          new Ext.ToolTip({
            target: ta.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            html: SM.resultCommentTipText
          }) 
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ResultTextArea.superclass.initComponent.call(this)
  }
})

SM.Review.Form.ActionCombo = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this
    const config = {
      triggerClass: 'sm-review-trigger',
      disabledClass: 'sm-review-item-disabled',
      width: 100,
      lastSavedData: "",
      cls: 'sm-review-combo-input',
      fieldLabel: 'Action<i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      name: 'action',
      hiddenName: 'action',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['action', 'actionStr'],
        data: [['remediate', 'Remediate'], ['mitigate', 'Mitigate'], ['exception', 'Exception']]
      }),
      displayField: 'actionStr',
      valueField: 'action',
      listeners: {
        'render': function (combo) {
          new Ext.ToolTip({
            target: combo.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            html: SM.actionTipText
          })
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ActionCombo.superclass.initComponent.call(this)
  }
})

SM.Review.Form.ActionTextArea = Ext.extend(Ext.form.TextArea, {
  initComponent: function () {
    const _this = this
    const config = {
      cls: 'sm-review-action-textarea',
      anchor: '100% -30',
      lastSavedData: "",
      allowBlank: true,
      fieldLabel: 'Comment<br><i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      autoScroll: 'auto',
      name: 'resultComment',
      name: 'actionComment',
      listeners: {
        'render': function (ta) {
          ta.mon( ta.el, 'input', function (e) {
            _this.form.setReviewFormItemStates(_this.form)
          })
          new Ext.ToolTip({
            target: ta.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            html: SM.actionCommentTipText
          }) 
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ActionTextArea.superclass.initComponent.call(this)
  }
})

SM.Review.Form.Button = Ext.extend(Ext.Button, {
  initComponent: function () {
    const _this = this
    const config = {
      text: 'Loading...',
      disabled: true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.Button.superclass.initComponent.call(this)
  }
})

SM.Review.Form.Panel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const rcb = new SM.Review.Form.ResultCombo({})
    const rta = new SM.Review.Form.ResultTextArea({})
    const acb = new SM.Review.Form.ActionCombo({})
    const ata = new SM.Review.Form.ActionTextArea({})
    const mdf = new Ext.form.DisplayField({
      anchor: '100% 2%',
      fieldLabel: 'Modified',
      allowBlank: true,
      name: 'editStr'
    })
    const btn1 = new SM.Review.Form.Button({
      handler: _this.btnHandler
    })
    const btn2 = new SM.Review.Form.Button({
      handler: _this.btnHandler
    })
    
    let config = {
      cls: 'sm-round-panel',
      bodyCssClass: 'sm-review-form',
      footerCssClass: 'sm-review-footer',
      border: false,
      isLoaded: false, // STIG Manager defined property
      groupGridRecord: {}, // STIG Manager defined property
      monitorValid: false,
      trackResetOnLoad: false,
      reviewChanged: function () { // STIG Manager defined property
        return (
          rcb.lastSavedData != rcb.value) 
          || (rta.lastSavedData != rta.getValue()) 
          || (acb.lastSavedData != acb.value) 
          || (ata.lastSavedData != ata.getValue()
        )
      },
      isDirty: function () {
        return (
          rcb.lastSavedData != rcb.value) 
          || (rta.lastSavedData != rta.getValue()) 
          || (acb.lastSavedData != acb.value) 
          || (ata.lastSavedData != ata.getValue()
        )
      },
      loadValues: function (values) {
        const form = _this.getForm()
       form.setValues.call(form, values)
        // Initialize the lastSavedData properties
        if ( rcb.value === null ) { rcb.value = '' }
        rcb.lastSavedData = rcb.value
        if (values.resultComment === null) {
          rta.lastSavedData = ""
        } else {
          rta.lastSavedData = rta.getValue()
        }
        if ( acb.value === null ) { acb.value = '' }
        acb.lastSavedData = acb.value
        if (values.actionComment === null) {
          ata.lastSavedData = ""
        } else {
          ata.lastSavedData = ata.getValue()
        }        
      },
      items: [
        {
          xtype: 'fieldset',
          anchor: '100%, 49%',
          title: 'Evaluation',
          items: [rcb, rta]
        },
        {
          xtype: 'fieldset',
          anchor: '100%, 49%',
          title: 'Recommendation',
          items: [acb, ata]
        },
        mdf
      ],
      buttons: [btn1, btn2],
      listeners: {
        render: function (formPanel) {
          formPanel.getForm().waitMsgTarget = formPanel.getEl()
          const reviewFormPanelDropTargetEl = formPanel.body.dom
          const reviewFormPanelDropTarget = new Ext.dd.DropTarget(reviewFormPanelDropTargetEl, {
            ddGroup: 'gridDDGroup',
            notifyEnter: function (ddSource, e, data) {
              const editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
              const copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
              if (editableDest && copyableSrc) { // accept drop of manual reviews or Open SCAP reviews with actions
                // no action
              } else {
                return (reviewFormPanelDropTarget.dropNotAllowed);
              }
            },
            notifyOver: function (ddSource, e, data) {
              const editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
              const copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
              if (editableDest && copyableSrc) { // accept drop of manual reviews or SCAP reviews with actions
                return (reviewFormPanelDropTarget.dropAllowed);
              } else {
                return (reviewFormPanelDropTarget.dropNotAllowed);
              }
            },
            notifyDrop: function (ddSource, e, data) {
              const editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
              const copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
              if (editableDest && copyableSrc) { // accept drop of manual reviews or SCAP reviews with actions
                // Reference the record (single selection) for readability
                const selectedRecord = data.selections[0];
                // Load the record into the form
                if (!rcb.disabled && selectedRecord.data.autoResult == false) {
                  rcb.setValue(selectedRecord.data.result);
                }
                rta.setValue(selectedRecord.data.resultComment);
                if (rcb.getValue() === 'fail') {
                  acb.enable();
                  ata.enable();
                } else {
                  acb.disable();
                  ata.disable();
                }
                if (!acb.disabled) {
                  acb.setValue(selectedRecord.data.action);
                }
                if (!ata.disabled) {
                  ata.setValue(selectedRecord.data.actionComment);
                }
                reviewForm.setReviewFormItemStates(reviewForm)
              }
              return (true);
            }
          })
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.Panel.superclass.initComponent.call(this)
  }
})