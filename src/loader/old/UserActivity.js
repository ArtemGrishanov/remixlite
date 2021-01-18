const REFRESH_TIME = 10000
const INACTIVE_MAX_TIME = 30 * 60 * 1000

class UserActivity {
    makeActivity = void 0

    onActivityLongTime = () => void 0
    onActivity = () => void 0
    onFirstActiviy = () => void 0

    _wasActivity = false
    _inactivityTime = 0

    _firstActivity = true

    constructor() {
        this.makeActivity = this._makeFirstActivity
    }

    _makeFirstActivity = () => {
        this._wasActivity = true

        if (this._firstActivity) {
            this._firstActivity = false

            this.onFirstActiviy()
        }

        this.makeActivity = this._makeActivity

        requestAnimationFrame(this._refreshLoop)
    }

    _makeActivity = () => {
        this._wasActivity = true
    }

    _activityLoop = diffTime => {
        this._inactivityTime += diffTime

        if (this._wasActivity) {
            if (this._inactivityTime >= INACTIVE_MAX_TIME) {
                this.onActivityLongTime()
            } else {
                this.onActivity()
            }

            this._wasActivity = false
            this._inactivityTime = 0
        }
    }

    _lastTime = Date.now()
    _refreshLoop = () => {
        const now = Date.now()
        const diffTime = now - this._lastTime
        if (diffTime >= REFRESH_TIME) {
            this._lastTime = now

            this._activityLoop(diffTime)
        }

        requestAnimationFrame(this._refreshLoop)
    }
}

export default UserActivity
