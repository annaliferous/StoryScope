import { useEffect, useState } from "react";
import { getDialogsForScenes, type Screenplay } from "../hooks/useScreenplay";
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

    const hasDialog = getDialogsForScenes(sceneIds, screenplay.document).length > 0;

    return <>
        {initState === InitState.done ?
            (hasDialog ? <NetworkGraph sceneIds={sceneIds} screenplay={screenplay} /> :
                <p>Selected scene(s) do not have any dialog.</p>
            ) :
            <h3 style={{
                textAlign: "center"
            }}>
                <CircularProgress color="secondary" />
                <br />
                Loading...
            </h3>}
    </>
}