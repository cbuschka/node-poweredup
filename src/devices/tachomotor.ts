import { BasicMotor } from "./basicmotor";

import { IDeviceInterface } from "../interfaces";

import * as Consts from "../consts";
import { mapSpeed } from "../utils";

export class TachoMotor extends BasicMotor {

    constructor (hub: IDeviceInterface, portId: number, modeMap: {[event: string]: number} = {}, type: Consts.DeviceType = Consts.DeviceType.UNKNOWN) {
        super(hub, portId, Object.assign({}, modeMap, ModeMap), type);
    }

    public receive (message: Buffer) {
        const mode = this._mode;

        switch (mode) {
            case Mode.ROTATION:
                const rotation = message.readInt32LE(this.isWeDo2SmartHub ? 2 : 4);
                /**
                 * Emits when a rotation sensor is activated.
                 * @event TachoMotor#rotate
                 * @param {number} rotation
                 */
                this.emitGlobal("rotate", { rotation });
                break;
        }
    }

    /**
     * Set the motor speed.
     * @method TachoMotor#setSpeed
     * @param {number} speed For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100. Stop is 0.
     * @returns {Promise} Resolved upon successful completion of command.
     */
    public setSpeed (speed: [number, number] | number, time: number | undefined) {
        if (!this.isVirtualPort && speed instanceof Array) {
            throw new Error("Only virtual ports can accept multiple speeds");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Motor speed is not available on the WeDo 2.0 Smart Hub");
        }
        return new Promise((resolve) => {
            this._busy = true;
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (time !== undefined) {
                if (speed instanceof Array) {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x0a, 0x00, 0x00, mapSpeed(speed[0]), mapSpeed(speed[1]), 0x64, 0x7f, 0x03]);
                } else {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x09, 0x00, 0x00, mapSpeed(speed), 0x64, 0x7f, 0x03]);
                }
                message.writeUInt16LE(time, 4);
            } else {
                if (speed instanceof Array) {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x08, mapSpeed(speed[0]), mapSpeed(speed[1]), 0x64, 0x7f, 0x03]);
                } else {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x07, mapSpeed(speed), 0x64, 0x03, 0x64, 0x7f, 0x03]);
                }
            }
            this.send(message);
            this._finished = () => {
                return resolve();
            };
        });
    }

    /**
     * Rotate a motor by a given angle.
     * @method TachoMotor#rotateByAngle
     * @param {number} angle How much the motor should be rotated (in degrees).
     * @param {number} [speed=100] For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100.
     * @returns {Promise} Resolved upon successful completion of command (ie. once the motor is finished).
     */
    public rotateByAngle (angle: number, speed: [number, number] | number) {
        if (!this.isVirtualPort && speed instanceof Array) {
            throw new Error("Only virtual ports can accept multiple speeds");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Angle rotation is not available on the WeDo 2.0 Smart Hub");
        }
        return new Promise((resolve) => {
            this._busy = true;
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (speed instanceof Array) {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0c, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed[0]), mapSpeed(speed[1]), 0x64, 0x7f, 0x03]);
            } else {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0b, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), 0x64, 0x7f, 0x03]);
            }
            message.writeUInt32LE(angle, 4);
            this.send(message);
            this._finished = () => {
                return resolve();
            };
        });
    }

}

export enum Mode {
    ROTATION = 0x02
}

export const ModeMap: {[event: string]: number} = {
    "rotate": Mode.ROTATION
};