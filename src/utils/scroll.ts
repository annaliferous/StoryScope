/**
 * Scrolls inside the given `ref` to the position which is given by the scene id.
 * @param id the id of the scene to scroll to.
 * @param where an enum representing which panels should be affected. E.g. editor | timeline | all
 * */
export function scrollToScene(id: string, where: "editor" | "timeline" | "all" = "all") {
    if (where !== "timeline") {
        const editor = document.querySelector('[data-editor-id="' + id + '"]');
        editor?.scrollIntoView({ behavior: 'smooth' });
    }
    if (where !== "editor") {
        const timeline = document.querySelector('[data-timeline-id="' + id + '"]');
        // Editor has scroll events which automatically fire updates on every scene change.
        // Therefore updates need to be instant!
        timeline?.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    }
}