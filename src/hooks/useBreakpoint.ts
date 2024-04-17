import { useMediaQuery } from 'react-responsive';

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
} as const;

type BreakpointKey = keyof typeof breakpoints;

export function useBreakpoint<K extends BreakpointKey>(breakpointKey: K) {
  return useMediaQuery({
    query: `(min-width: ${breakpoints[breakpointKey]})`,
  });
}
