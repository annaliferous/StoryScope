import { createContext, type Dispatch, type SetStateAction } from "react";

// This is a nasty hack!
// Once you update the counter of this context,
// All components which listen to this context will forcefully rerender.
// Let's keep it a dirty little secret. But objects passed by reference (like the getCharacterColor) benefit tremendously from it.

interface CounterContextType {
  counter: number;
  setCounter: Dispatch<SetStateAction<number>>;
}
export const CounterContext = createContext<CounterContextType>({
  counter: 0,
  setCounter: () => {},
});
