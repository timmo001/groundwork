// The Groundwork demo app as an Omarchy panel: a bar button that opens a
// keyboard panel listing the fixture items, with apply and restart actions.
// It uses the shared panel components from groundwork's qml/, which the dev
// script copies in beside it. Docs: https://groundwork.timmo.dev/demo
import QtQuick
import QtQuick.Controls
import Quickshell
import qs.Commons
import qs.Commons as Commons
import qs.Ui

Panel {
  id: root
  moduleName: "timmo.groundwork-demo"
  ipcTarget: "timmo.groundwork-demo"

  // The same fixture items as @timmo001/groundwork-demo's fixtureItems.
  readonly property var fixtureItems: [
    { id: "tools", name: "mise tools", description: "Bun, Node and the linters the checks run", current: "2026.10.4", available: "2026.11.0", pending: true },
    { id: "skills", name: "Shared skills", description: "Agent skills synced from the skills repository", current: "a1c09e2", available: "f42b7d0", pending: true },
    { id: "themes", name: "Themes", description: "Groundwork's tokens and theme CSS", current: "0.3.1", available: "0.3.1", pending: false },
    { id: "firmware", name: "Firmware", description: "The machine's BIOS and device firmware", current: "1.19", available: "1.21", pending: true }
  ]
  property var items: fixtureItems
  property string lastAction: ""

  readonly property color contentForeground: bar ? bar.foreground : Commons.Color.foreground
  readonly property string contentFontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property int pendingCount: items.filter(function(item) { return item.pending }).length

  readonly property var rows: {
    var result = [
      { key: "action:apply", kind: "action", section: "actions", action: "apply", icon: "󰚰", primaryText: "Apply all pending", secondaryText: "" },
      { key: "action:restart", kind: "action", section: "actions", action: "restart", icon: "󰜉", primaryText: "Restart the system", secondaryText: "" }
    ]
    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      result.push({ key: "item:" + item.id, kind: "item", section: "items", value: item, primaryText: item.name, secondaryText: item.description })
    }
    return result
  }

  function applyItem(id) {
    items = items.map(function(item) {
      return item.id === id || id === "" ? Object.assign({}, item, { current: item.available, pending: false }) : item
    })
  }

  function activateEntry(entry) {
    if (entry.kind === "item") {
      if (!entry.value.pending) return
      applyItem(entry.value.id)
      lastAction = "Applied " + entry.value.name
    } else if (entry.action === "apply") {
      var count = pendingCount
      applyItem("")
      lastAction = count > 0 ? "Applied " + count + (count === 1 ? " item" : " items") : "Nothing to apply"
    } else if (entry.action === "restart") {
      items = fixtureItems
      lastAction = "Restarted, back to the fixture items"
    }
  }

  onOpenedChanged: if (opened) {
    filterController.reset()
    Qt.callLater(function() { filterController.forceActiveFocus() })
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰏗"
    labelText: root.pendingCount > 0 ? String(root.pendingCount) : ""
    fixedWidth: vertical || labelText === "" ? (vertical ? -1 : slotSize) : -1
    tooltipText: root.pendingCount > 0 ? root.pendingCount + " to apply" : "Everything is up to date"
    onPressed: function(buttonCode) { root.toggle() }
  }

  KeyboardPanel {
    id: panel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: filterController
    contentWidth: panel.fittedContentWidth(Style.space(420))
    contentHeight: panel.fittedContentHeight(contentColumn.implicitHeight, panel.screenH * 0.8)

    FilterablePanel {
      id: filterController
      anchors.fill: parent
      model: root.rows
      onActivateRequested: function(entry, modifiers) { root.activateEntry(entry) }
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      PanelFlickable {
        id: panelFlick
        anchors.fill: parent
        contentWidth: width
        contentHeight: contentColumn.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        flickableDirection: Flickable.VerticalFlick
        interactive: contentHeight > height
        ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

        Column {
          id: contentColumn
          width: panelFlick.width
          spacing: Style.space(12)

          PanelHeader {
            title: "Groundwork demo"
            meta: root.lastAction !== "" ? root.lastAction
              : (root.pendingCount > 0 ? root.pendingCount + " to apply" : "Everything is up to date")
            detail: root.pendingCount > 0 ? "PENDING" : "UP TO DATE"
            foreground: root.contentForeground
            fontFamily: root.contentFontFamily
            iconComponent: Component {
              Text {
                text: "󰏗"
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: Style.font.display
              }
            }
          }

          Repeater {
            model: [
              { section: "actions", title: filterController.filterText || "Actions" },
              { section: "items", title: "Items" }
            ]

            Column {
              id: sectionColumn
              required property var modelData
              readonly property var sectionRows: filterController.filteredModel.filter(function(entry) {
                return entry.section === sectionColumn.modelData.section
              })
              visible: sectionRows.length > 0
              width: contentColumn.width
              spacing: Style.space(4)

              SectionHeading {
                title: sectionColumn.modelData.title
                foreground: root.contentForeground
                fontFamily: root.contentFontFamily
              }

              Repeater {
                model: sectionColumn.sectionRows

                CursorSurface {
                  id: row
                  required property var modelData
                  readonly property bool pending: modelData.kind === "item" && modelData.value.pending
                  width: contentColumn.width
                  implicitHeight: rowContent.implicitHeight + Style.space(12)
                  hasCursor: filterController.cursorIndex === filterController.indexForKey(modelData.key)
                  foreground: root.contentForeground
                  accent: root.contentForeground

                  Row {
                    id: rowContent
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.leftMargin: Style.space(8)
                    anchors.rightMargin: Style.space(8)
                    spacing: Style.space(10)

                    Text {
                      width: Style.space(22)
                      text: row.modelData.kind === "action" ? row.modelData.icon : (row.pending ? "󰚰" : "󰄬")
                      color: row.pending ? (root.bar ? root.bar.urgent : Commons.Color.urgent) : root.contentForeground
                      font.family: root.contentFontFamily
                      font.pixelSize: Style.font.icon
                      horizontalAlignment: Text.AlignHCenter
                    }

                    Column {
                      width: Math.max(0, rowContent.width - Style.space(32))
                      spacing: Style.space(2)

                      Text {
                        width: parent.width
                        text: row.modelData.primaryText
                        color: root.contentForeground
                        font.family: root.contentFontFamily
                        font.pixelSize: Style.font.body
                        elide: Text.ElideRight
                      }

                      Text {
                        width: parent.width
                        visible: row.modelData.kind === "item"
                        text: row.modelData.kind !== "item" ? ""
                          : (row.pending
                            ? row.modelData.value.current + " → " + row.modelData.value.available
                            : row.modelData.value.current + " · up to date")
                        color: Qt.darker(root.contentForeground, 1.4)
                        font.family: root.contentFontFamily
                        font.pixelSize: Style.font.caption
                        elide: Text.ElideRight
                      }
                    }
                  }

                  MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onEntered: filterController.cursorIndex = filterController.indexForKey(row.modelData.key)
                    onClicked: root.activateEntry(row.modelData)
                  }
                }
              }
            }
          }

          Text {
            visible: filterController.count === 0
            width: parent.width
            text: "No matches for “" + filterController.filterText + "”"
            color: Qt.darker(root.contentForeground, 1.4)
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.body
            horizontalAlignment: Text.AlignHCenter
          }
        }
      }
    }
  }
}
