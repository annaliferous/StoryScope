import { createContext } from "react";

// This is a nasty hack!
// Once you update the counter of this context,
// All components which listen to this context will forcefully rerender.
// Let's keep it a dirty little secret. But objects passed by reference (like the getCharacterColor) benefit tremendously from it.

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const CounterContext = createContext<{ counter: number, setCounter: Function }>({ counter: 0, setCounter: () => { } });