import { useEffect, useState } from "react";
import type { Screenplay } from "../hooks/useScreenplay";
import NetworkGraph from "./NetworkGraph";
import { useSentiment } from "../hooks/useSentiment";
import { CircularProgress } from "@mui/material";

enum InitState {
    initializing,
    loading,
    done,
}

export function RelationshipGraph({ sceneIds, screenplay }: { sceneIds: string[], screenplay: Screenplay }) {
    const { analyze } = useSentiment();
    const [initState, setInitState] = useState<InitState>(InitState.initializing);

    useEffect(() => {
        analyze("initialize")
            .then(() => {
                setInitState(InitState.loading)
            })
            .catch(console.error)
            .finally(() => setInitState(InitState.done));
    }, [])


    return <>
        {initState === InitState.done ?
            <NetworkGraph sceneIds={sceneIds} screenplay={screenplay} /> :
            <h3 style={{
                textAlign: "center"
            }}>
                <CircularProgress color="secondary" />
                <br />
                Loading...
            </h3>}
    </>
}