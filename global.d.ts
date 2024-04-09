import '@tanstack/react-table';

declare module '@tanstack/table-core' {
  interface ColumnMeta {
    align: 'left' | 'center' | 'right';
  }
}
