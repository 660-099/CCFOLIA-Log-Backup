import { LogEntry, TabSetting } from '../types';
import { parseLogFile } from '../parser';
import { extractOldFormat, migrateCharSettings } from './migration';

// We can extract pure logic here
