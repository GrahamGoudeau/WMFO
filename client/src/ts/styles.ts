const BACKGROUND_GRAY = "#333";
const BOX_BACKGROUND = "#f3f3f3";
const BORDER_COLOR = "#e7e7e7";
const BORDER_WIDTH = "1px";

export default class WMFOStyles {
    static readonly GLOBAL_STYLE = {
        fontFamily: "Avenir, Times, Arial",
        backgroundColor: BACKGROUND_GRAY,
        width: "100%",
        height: "100%",
    };
    static readonly NAVBAR_STYLE = {
        listStyleType: "none",
        margin: 0,
        padding: 0,
        border: "1px solid",
        backgroundColor: BOX_BACKGROUND,
        borderRadius: "7px",
    };
    static readonly NAVBAR_ITEM_STYLE = {
        float: "left",
    };
    static readonly LOGO_STYLE = {
        width: "20%",
    };
    static readonly FULL_SIZE = {
        width: "100%",
        height: "100%",
    };
    static readonly TEXT_INPUT_STYLE = {
        display: "block",
        margin: "0 auto",
        marginTop: "5%",
        marginBottom: "5%",
        padding: "10px",
        transition: "box-shadow 0.3s, border 0.3s;",
    };
    static readonly FOCUSED_TEXT_INPUT_STYLE = Object.assign({}, WMFOStyles.TEXT_INPUT_STYLE, {
        border: "solid 1px #707070",
        boxShadow: "0 0 5px 1px #969696",
    });
    static readonly BUTTON_STYLE = {
        display: "block",
        padding: "4% 8% 4% 8%",
        margin: "0 auto",
        border: "none",
        marginBottom: "3%",
        borderRadius: "7px",
        color: "white",
        backgroundColor: BACKGROUND_GRAY,
    };
    static readonly FORM_STYLE = {
        border: `${BORDER_WIDTH} solid`,
        backgroundColor: BOX_BACKGROUND,
        width: "40%",
        height: "30%",
        display: "table",
        margin: "0 auto",
        position: "relative",
        borderRadius: "7px",
    };
    static readonly SIGN_IN_MESSAGE = {
        display: "inline-block",
        color: BORDER_COLOR,
        fontSize: "1em",
        float: "right",
        marginTop: "2%",
        marginRight: "2%",
    };
}
