/* eslint-disable no-console */

declare let tinymce: any;

export default function () {
  const commonConfig = {
    plugins: 'link lists image emoticons code searchreplace',
    // menubar: false,
    // icons: 'thin',
    inline: true,
    toolbar_persist: true,
    fixed_toolbar_container: '.toolbar',
    // skin: 'borderless',
    custom_ui_selector: '.tox-menubar',
    placeholder: 'Write your email here...',
    style_formats: [
      { title: 'Paragraph', format: 'p' },
      { title: 'Heading 1', format: 'h1' },
      { title: 'Heading 2', format: 'h2' },
      { title: 'Button styles'},
      { title: 'Call-to-action', format: 'cta' },
    ],
    formats: {
      h1: { block: 'h1', styles: { fontSize: '32px' } },
      h2: { block: 'h2', styles: { fontSize: '18px' } },
      cta: { selector: 'a', styles: { backgroundColor: '#706FD3', padding: '12px 16px', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', display: 'inline-block'} }
    },
    target_list: false,
    setup: (editor) => {
      editor.on('focus', (e) => {
        editor.ui.show();
        tinymce.editors.forEach((ed) => {
          if (e.target !== ed) {
            ed.ui.hide();
          }
        });
      });
    }
  };

  tinymce.init({
    selector:'#tinymce-1',
    auto_focus: 'tinymce-1',
    toolbar: 'styleselect | bold italic underline strikethrough | forecolor backcolor | link image emoticons | alignleft aligncenter alignright | bullist numlist | code removeformat',
    ...commonConfig
  });

  tinymce.init({
    selector:'#tinymce-2',
    toolbar: 'bold italic underline strikethrough',
    ...commonConfig
  });

  tinymce.init({
    selector:'#tinymce-3',
    toolbar: 'styleselect | bold italic | forecolor backcolor | link',
    ...commonConfig
  });
}
