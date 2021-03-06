/**
 * @flow
 */

import type {ChunkID, ModuleID, RawStats} from '../types/Stats';
import type {FullModuleDataType} from '../stats/fullModuleData';
import type {
  FilterableFields,
  FilterProps,
} from '../stats/filterModules';
import type { SortableFields, SortProps } from '../stats/sortModules';

import fullModuleData from '../stats/fullModuleData';
import getCollapsableParentOf from '../stats/getCollapsableParentOf';
import getModulesById from '../stats/getModulesById';

export type Action =
  | {
    type: 'discoveredDataPaths',
    paths: Array<string>,
  }
  | {
    type: 'pickDataPath',
    path: string,
  }
  | {
    type: 'requestedDataAtPath',
    path: string,
  }
  | {
    type: 'loadedStatsAtPath',
    path: string,
    stats: RawStats,
  }
  | {
    type: 'erroredAtPath',
    path: string,
    error: Error | string,
  }
  | {
    type: 'onSorted',
    field: SortableFields,
  }
  | {
    type: 'onFiltered',
    changes: {[key: FilterableFields]: string},
  }
  | {
    type: 'onPickedChunk',
    chunkId: ChunkID,
  }
  | {
    type: 'onRemoveModule',
    moduleID: ModuleID,
  }
  | {
    type: 'onIncludeModule',
    moduleID: ModuleID,
  }
  | {
    type: 'changeExpandRecordsMode',
    mode: 'manual' | 'expand-all' | 'collapse-all',
  }
  | {
    type: 'onExpandRecords',
    moduleID: ModuleID,
  }
  | {
    type: 'onCollapseRecords',
    moduleID: ModuleID,
  }
  | {
    type: 'onFocusChanged',
    elementID: ?string,
  }
  ;

type DataPathState = 'unknown' | 'loading' | 'error' | 'ready';
export type State = {
  dataPaths: {[path: string]: DataPathState},
  selectedFilename: ?string,
  selectedChunkId: ?ChunkID,
  blacklistedModuleIds: Array<ModuleID>,
  json: {[filename: string]: RawStats},
  sort: SortProps,
  filters: FilterProps,
  expandMode: 'manual' | 'expand-all' | 'collapse-all',
  expandedRecords: Set<ModuleID>,
  currentlyFocusedElementID: ?string,
  calculatedFullModuleData: ?FullModuleDataType,
};

export type Dispatch = (action: Action) => any;

export const INITIAL_STATE: State = {
  dataPaths: {},
  selectedFilename: null,
  selectedChunkId: null,
  blacklistedModuleIds: [],
  json: {},
  sort: {
    field: 'cumulativeSize',
    direction: 'DESC',
  },
  filters: {
    moduleName: '',
    cumulativeSizeMin: '',
    cumulativeSizeMax: '',
    requiredByCountMin: '',
    requiredByCountMax: '',
    requirementsCountMin: '',
    requirementsCountMax: '',
  },
  expandMode: 'collapse-all',
  expandedRecords: new Set(),
  currentlyFocusedElementID: null,
  calculatedFullModuleData: null,
};

function handleAction(
  state: State,
  action: Action,
): State {
  switch(action.type) {
    case 'discoveredDataPaths':
      return {
        ...state,
        dataPaths: {
          ...action.paths.reduce((map, path) => {
            map[path] = map[path] || 'unknown';
            return map;
          }, {}),
          ...state.dataPaths,
        },
      };
    case 'pickDataPath':
      return {
        ...state,
        dataPaths: {
          [action.path]: state.dataPaths[action.path] || 'unknown',
          ...state.dataPaths,
        },
        selectedFilename: action.path,
        selectedChunkId: null,
        blacklistedModuleIds: [],
        expandMode: 'collapse-all',
        expandedRecords: new Set(),
        currentlyFocusedElementID: null,
      };
    case 'requestedDataAtPath':
      return {
        ...state,
        dataPaths: {
          ...state.dataPaths,
          [action.path]: state.dataPaths[action.path] === 'ready'
            ? 'ready'
            : 'loading',
        },
      };
    case 'loadedStatsAtPath':
      return {
        ...state,
        dataPaths: {
          ...state.dataPaths,
          [action.path]: 'ready',
        },
        json: {
          ...state.json,
          [action.path]: action.stats,
        },
      };
    case 'erroredAtPath':
      return {
        ...state,
        dataPaths: {
          ...state.dataPaths,
          [action.path]: 'error',
        },
      };
    case 'onSorted': {
      const isSameField = state.sort.field === action.field;
      const invertedDir = state.sort.direction === 'ASC' ? 'DESC': 'ASC';
      const nextDirection = isSameField ? invertedDir : 'DESC';
      return {
        ...state,
        sort: {
          field: action.field,
          direction: nextDirection,
        },
      };
    }
    case 'onFiltered':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.changes,
        },
      };
    case 'onPickedChunk':
      return {
        ...state,
        selectedChunkId: String(action.chunkId),
        blacklistedModuleIds: [],
        expandMode: 'collapse-all',
        expandedRecords: new Set(),
        currentlyFocusedElementID: null,
      };
    case 'onRemoveModule':
      return {
        ...state,
        blacklistedModuleIds: [
          ...state.blacklistedModuleIds,
          action.moduleID,
        ],
      };
    case 'onIncludeModule': {
      const moduleID = action.moduleID;
      return {
        ...state,
        blacklistedModuleIds: state.blacklistedModuleIds.filter(
          (id) => String(id) !== String(moduleID),
        ),
      };
    }
    case 'changeExpandRecordsMode':
      return {
        ...state,
        expandMode: action.mode,
      };
    case 'onExpandRecords':
      return {
        ...state,
        expandMode: 'manual',
        expandedRecords: new Set(state.expandedRecords.add(action.moduleID)),
      };
    case 'onCollapseRecords': {
      const expandedRecords = new Set(state.expandedRecords);
      expandedRecords.delete(action.moduleID);
      return {
        ...state,
        expandMode: state.expandedRecords.size === 0
          ? 'collapse-all'
          : 'manual',
        expandedRecords: expandedRecords,
      };
    }
    case 'onFocusChanged': {
      if (
        action.elementID &&
        state.calculatedFullModuleData &&
        state.calculatedFullModuleData.extendedModules
      ) {
        const moduleId = action.elementID;
        const modulesById = getModulesById(state.calculatedFullModuleData.extendedModules);
        const collapseableParent = getCollapsableParentOf(
          modulesById,
          moduleId,
        );
        return {
          ...state,
          expandMode: collapseableParent
            ? 'manual'
            : state.expandMode,
          expandedRecords: collapseableParent
            ? new Set(state.expandedRecords.add(collapseableParent.id))
            : state.expandedRecords,
          currentlyFocusedElementID: action.elementID,
        };
      } else {
        return {
          ...state,
          currentlyFocusedElementID: action.elementID,
        };
      }
    }
    default:
      return state;
  }
}

function calculateFullModuleData(
  oldState: State,
  newState: State,
): State {
  if (
    !newState.json ||
    !newState.selectedFilename ||
    !newState.json[newState.selectedFilename]
  ) {
    return {
      ...newState,
      calculatedFullModuleData: null,
    };
  }

  if (
    oldState.json === newState.json &&
    oldState.selectedFilename === newState.selectedFilename &&
    oldState.selectedChunkId === newState.selectedChunkId &&
    oldState.blacklistedModuleIds === newState.blacklistedModuleIds
  ) {
    return newState;
  }

  return {
    ...newState,
    calculatedFullModuleData: fullModuleData(
      newState.json[newState.selectedFilename],
      newState.selectedChunkId,
      newState.blacklistedModuleIds,
    ),
  };
}

export default function reducer(
  state: State = INITIAL_STATE,
  action: Action,
): State {
  return calculateFullModuleData(
    state,
    handleAction(state, action)
  );
}
