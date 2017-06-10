export type Semester = 'FALL' | 'SPRING' | 'SUMMER';

export interface SemesterResult {
    semester: Semester;
    year: number;
}

export function getThisSemester(): SemesterResult {
    const today = new Date();
    const springSemesterBegin = 0; // January is 0
    const summerSemesterBegin = 5;
    const fallSemesterBegin = 8;

    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    let semester: Semester;
    if (thisMonth < summerSemesterBegin) {
        semester = "SPRING";
    } else if (thisMonth < fallSemesterBegin) {
        semester = "SUMMER";
    } else {
        semester = "FALL";
    }

    return {
        semester: semester,
        year: thisYear
    };
}

export function getSemesterOffset(fromSemester: SemesterResult, numSemesters: number): SemesterResult {
    let newSemester: SemesterResult;
    let newOffset: number;
    if (numSemesters < 0) {
        newOffset = numSemesters + 1;

        if (fromSemester.semester === "SPRING") {
            newSemester = {
                semester: "FALL",
                year: fromSemester.year - 1
            };
        } else if (fromSemester.semester === "SUMMER") {
            newSemester = {
                semester: "SPRING",
                year: fromSemester.year
            };
        } else {
            newSemester = {
                semester: "SUMMER",
                year: fromSemester.year
            };
        }
    } else if (numSemesters > 0) {
        newOffset = numSemesters - 1;

        if (fromSemester.semester === "FALL") {
            newSemester = {
                semester: "SPRING",
                year: fromSemester.year + 1
            };
        } else if (fromSemester.semester === "SPRING") {
            newSemester = {
                semester: "SUMMER",
                year: fromSemester.year
            };
        } else {
            newSemester = {
                semester: "FALL",
                year: fromSemester.year
            }
        }
    } else {
        return fromSemester;
    }

    return getSemesterOffset(newSemester, newOffset);
}
