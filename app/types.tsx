export enum BoxType {
    TalkBox,
    OptionBox,
    GenericBox,
}

export interface BoxInfo {
    id: number;
    type: BoxType;
    text: string;
    image: string;
    color: string;
}

export interface AppSettings {
    boxMargin: number;
    numHorizontalBoxes: number;
}