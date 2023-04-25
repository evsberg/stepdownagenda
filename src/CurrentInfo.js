import React, { Component } from "react";
import "./CurrentInfo.scss";
import moment from "moment";
import "moment-timezone";
import "moment-duration-format";

class CurrentInfo extends Component {
  render() {
    const { time, currentValue } = this.props;
    if (!currentValue) {
      return null;
    }

    const { value, timeToNext, nextTime, nextTask, startTime } = currentValue;
    //const startTimeFormatted = startTime ? startTime.format("HHmm") : null;
    const nextTimeMoment = moment(`${nextTime}`, "HHmm");
    const currentTimeMoment = moment(`${time}`, "HH:mm");
    const currentTimeFormatted = currentTimeMoment.format("HHmm");
    const startTimeMoment = startTime ? moment(`${startTime}`, "h:mm A") : null;
    const startTimeFormatted = startTimeMoment
      ? startTimeMoment.format("HHmm")
      : null;
    const timeToNextDuration = moment.duration(timeToNext, "minutes");
    const timeToNextMoment = moment(nextTimeMoment).add(
      timeToNextDuration,
      "minutes"
    );
    const isBeforeNextTime = currentTimeMoment.isBefore(nextTimeMoment);
    const timeElapsed = isBeforeNextTime
      ? startTimeMoment
        ? moment.duration(currentTimeMoment.diff(startTimeMoment)).asMinutes()
        : 0
      : moment.duration(currentTimeMoment.diff(timeToNextMoment)).asMinutes() *
        -1;
    //console.log(timeElapsed);
    const totalTime = moment
      .duration(nextTimeMoment.diff(startTimeMoment))
      .asMinutes();
    //console.log(nextTimeMoment, startTimeMoment);
    //console.log("total time", totalTime);
    const elapsedPercentage = (timeElapsed / totalTime) * 100;
    //console.log("percentage", elapsedPercentage);
    const timeToNextHumanized = moment
      .duration(timeToNext, "minutes")
      .format("h [hours], m [minutes]");
    //console.log(nextTime);
    //<span className="current-time">{currentTimeFormatted}</span>

    return (
      <div className="current-info-container">
        <div className="current-info">
          <span className="current-value">{value}</span>{" "}
          <div className="timebar">
            <span className="start-time">{startTimeFormatted}</span>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${elapsedPercentage}%` }}
              ></div>
            </div>
            <span className="next-time">{nextTime}</span>
          </div>
          <span className="time-to-next">
            Next up <span className="next-task">{nextTask}</span> in{" "}
            {timeToNextHumanized}
          </span>
        </div>
      </div>
    );
  }
}

export default CurrentInfo;
