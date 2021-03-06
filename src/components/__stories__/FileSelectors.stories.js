/**
 * @flow
 */

import FileSelectors from '../FileSelectors';
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

storiesOf('FileSelectors', module)
  .add('No filename, empty list', () => (
    <FileSelectors
      dataPaths={[]}
      filename={null}
      selectedChunkId={null}
      chunksByParent={[]}
      onChangedMode={action('on change mode')}
      onPickedFile={action('on stats file picked')}
      onSelectChunkId={action('on select chunk id')}
    />
  ))
  .add('No filename, items in list', () => (
    <FileSelectors
      dataPaths={['stats.json']}
      filename={null}
      selectedChunkId={null}
      chunksByParent={[]}
      onChangedMode={action('on change mode')}
      onPickedFile={action('on stats file picked')}
      onSelectChunkId={action('on select chunk id')}
    />
  ))
  .add('Filename picked', () => (
    <FileSelectors
      dataPaths={['stats.json']}
      filename={'stats.json'}
      selectedChunkId={null}
      chunksByParent={[]}
      onChangedMode={action('on change mode')}
      onPickedFile={action('on stats file picked')}
      onSelectChunkId={action('on select chunk id')}
    />
  ))
  .add('Invalid: empty list, filename picked', () => (
    <FileSelectors
      dataPaths={[]}
      filename={'stats.json'}
      selectedChunkId={null}
      chunksByParent={[]}
      onChangedMode={action('on change mode')}
      onPickedFile={action('on stats file picked')}
      onSelectChunkId={action('on select chunk id')}
    />
  ));
