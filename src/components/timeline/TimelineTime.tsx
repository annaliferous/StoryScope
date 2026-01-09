export function TimelineTime({ height, scenePadding, width }: { height: number, scenePadding: number, width: number }) {
    return <div style={{
        display: "flex",
        height: height + "px",
        marginBottom: scenePadding,
        backgroundColor: "#c5cae9",
        width: "calc(50% + " + width + "px)",
        backgroundImage: "url('/Indicator.svg')",
        backgroundSize: "auto 50%",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "10px bottom",
        color: "#1a237e",
    }}>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(percentage => {
            return <span key={percentage} style={{
                display: "block",
                width: "10%",
                color: "#1a237e",
            }}>
                {percentage}%
            </span>
        })}
    </div>;
}