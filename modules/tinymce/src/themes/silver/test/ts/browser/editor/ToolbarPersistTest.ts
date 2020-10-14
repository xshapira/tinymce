import { ApproxStructure, Assertions, Chain, ChainSequence, Guard, Log, Pipeline, UiFinder } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { Editor as McEditor, UiChains } from '@ephox/mcagar';
import { SugarElement, SugarBody, Insert, Focus, Remove, Visibility } from '@ephox/sugar';
import { Fun } from '@ephox/katamari';
import Theme from 'tinymce/themes/silver/Theme';
import Editor from 'tinymce/core/api/Editor';

UnitTest.asynctest('browser.tinymce.themes.silver.editor.ToolbarPersistTest', (success, failure) => {
  Theme();

  const cWaitForHidden = UiChains.cWaitForState(Fun.not(Visibility.isVisible));

  const cShowEditorUi = Chain.op((editor: Editor) => editor.ui.show());
  const cHideEditorUi = Chain.op((editor: Editor) => editor.ui.hide());

  const cFocusEditor = Chain.op((editor: Editor) => {
    editor.focus();
    editor.nodeChanged();
  });

  const cUnfocusEditor = Chain.op((_) => {
    const div = SugarElement.fromTag('input');
    Insert.append(SugarBody.body(), div);
    Focus.focus(div);
    Remove.remove(div);
  });

  const cAssertToolbarState = (label: string, disabled: boolean) => Chain.fromIsolatedChainsWith(SugarBody.body(), [
    UiFinder.cFindIn('.tox-toolbar'),
    Chain.control(
      Assertions.cAssertStructure(label, ApproxStructure.build((s, str, arr) =>
        s.element('div', {
          classes: [
            arr.has('tox-toolbar'),
            disabled ? arr.has('tox-tbtn--disabled') : arr.not('tox-tbtn--disabled')
          ],
          attrs: { 'aria-disabled': str.is(disabled + '') }
        })
      )),
      Guard.tryUntil('Waiting for toolbar state')
    )
  ]);

  Pipeline.async({}, [
    Log.chainsAsStep('TINY-4847', 'Test toolbar_persist', [
      McEditor.cFromSettings({
        theme: 'silver',
        inline: true,
        base_url: '/project/tinymce/js/tinymce',
        toolbar_persist: true
      }),
      UiChains.cWaitForPopup('Wait for editor to be visible', '.tox-tinymce-inline'),
      cFocusEditor,

      Chain.label('Editor should persist and toggle between enabled/disabled on focus/blur', ChainSequence.sequence([
        cUnfocusEditor,
        cAssertToolbarState('Editor UI should disable on blur', true),
        Chain.wait(100), // Need to wait since editor should remain visible.
        UiChains.cWaitForPopup('Wait for editor to be visible', '.tox-tinymce-inline'),
        cFocusEditor,
        cAssertToolbarState('Editor UI should enable on focus', false)
      ])),

      Chain.label('Should be able to hide/show editor using APIs. Editor should "persist" in its hidden state once hidden', ChainSequence.sequence([
        cUnfocusEditor,
        cHideEditorUi,
        cWaitForHidden('Wait for editor to be hidden', '.tox-tinymce-inline'),
        cFocusEditor,
        Chain.wait(100), // Need to wait since editor should remain hidden.
        cWaitForHidden('Wait for editor to be hidden', '.tox-tinymce-inline'),
        cShowEditorUi,
        UiChains.cWaitForPopup('Wait for editor to be visible', '.tox-tinymce-inline')
      ])),


      McEditor.cRemove
    ])
  ], success, failure);
});
