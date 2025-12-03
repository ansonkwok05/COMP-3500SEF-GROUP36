// OrderStateMachine.js
class OrderStateMachine {
    constructor() {
        // singleton pattern: ensure only one instance globally
        if (OrderStateMachine.instance) {
            return OrderStateMachine.instance;
        }
        OrderStateMachine.instance = this;

        // restore state from local storage
        this._loadFromStorage();

        // if no order exists, initialize empty state
        if (!this.State) {
            this.State = {
                OrderID:     '',
                Created:     'you dont have order',
                OrderAccept: '',
                FoodPrepare: '',
                RiderAccept: '',
                Delivery:    '',
                OrderFinish: '',
                Cancel:      ''
            };

            // init state time
            this.StateDates = {
                Created:     null,
                OrderAccept: null,
                FoodPrepare: null,
                RiderAccept: null,
                Delivery:    null,
                OrderFinish: null,
                Cancel:      null
            };
        }

        // listen for changes from other pages
        window.addEventListener('storage', this._handleStorageEvent.bind(this));

        return this;
    }

    // create order
    changeStateCreated() {
        // if first time creating, generate order ID
        if (this.State.Created === 'you dont have order') {
            this.State.OrderID = 'ORD_' + Date.now();
        }

        this.State.Created = 'finish';
        this.StateDates.Created = this.setTime();
        this._saveToStorage();

        return this.State.Created;
    }

    // merchant accepts order
    changeStateOrderAccept() {
        this.State.OrderAccept = 'finish';
        this.StateDates.OrderAccept = this.setTime();
        this._saveToStorage();

        return this.State.OrderAccept;
    }

    // prepare food
    changeStateFoodPrepare() {
        this.State.FoodPrepare = 'finish';
        this.StateDates.FoodPrepare = this.setTime();
        this._saveToStorage();

        return this.State.FoodPrepare;
    }

    // rider accepts order
    changeStateRiderAccept() {
        this.State.RiderAccept = 'finish';
        this.StateDates.RiderAccept = this.setTime();
        this._saveToStorage();

        return this.State.RiderAccept;
    }

    // delivery in progress
    changeStateDelivery() {
        this.State.Delivery = 'finish';
        this.StateDates.Delivery = this.setTime();
        this._saveToStorage();

        return this.State.Delivery;
    }

    // order completed
    changeStateOrderFinish() {
        this.State.OrderFinish = 'finish';
        this.StateDates.OrderFinish = this.setTime();
        this._saveToStorage();

        return this.State.OrderFinish;
    }

    // cancel order
    changeStateCancel() {
        this.State.Cancel = 'cancelled';
        this.StateDates.Cancel = this.setTime();

        // when canceling order, clear other states
        this.State.Created = 'cancelled';
        this.State.OrderAccept = '';
        this.State.FoodPrepare = '';
        this.State.RiderAccept = '';
        this.State.Delivery = '';
        this.State.OrderFinish = '';

        this.StateDates.OrderAccept = null;
        this.StateDates.FoodPrepare = null;
        this.StateDates.RiderAccept = null;
        this.StateDates.Delivery = null;
        this.StateDates.OrderFinish = null;

        this._saveToStorage();
        return this.State.Cancel;
    }

    // get current state list
    getCurrentState() {
        // if no order ID, return empty array
        if (!this.State.OrderID) {
            return ["you dont have order"];
        }

        const stateKeys = Object.keys(this.State);
        let i = 1; // start from Created (skip OrderID)
        const list = [];

        // add order ID
        list.push("OrderID: " + this.State.OrderID);

        while (i < stateKeys.length) {
            const stateKey = stateKeys[i];

            // if Cancel state, handle directly
            if (stateKey === 'Cancel') {
                if (this.StateDates.Cancel !== null) {
                    list.push("Cancel: " + this.State.Cancel + " (" + this.StateDates.Cancel + ")");
                    list.push("Order canceled...");
                }
                break;
            }

            // if current state time is null, not yet reached this step
            if (this.StateDates[stateKey] === null) {
                list.push(stateKey + ": " + this.State[stateKey]);
                break;
            } else {
                // state with time, show state and time
                list.push(stateKey + ": " + this.State[stateKey] + " (" + this.StateDates[stateKey] + ")");
            }
            i++;
        }

        return list;
    }

    // display state on page
    displayStateOnPage(elementId) {
        const stateList = this.getCurrentState();
        const element = document.getElementById(elementId);

        if (element) {
            element.innerHTML = stateList.map(item => `<p>${item}</p>`).join('');
        }

        return stateList;
    }

    // set time (24-hour format)
    setTime() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return formatter.format(now);
    }

    // save to local storage
    _saveToStorage() {
        const data = {
            State: this.State,
            StateDates: this.StateDates
        };
        localStorage.setItem('orderStateMachine', JSON.stringify(data));

        // trigger storage event for other page synchronization
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'orderStateMachine',
            newValue: JSON.stringify(data)
        }));
    }

    // load from local storage
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('orderStateMachine');
            if (saved) {
                const data = JSON.parse(saved);
                this.State = data.State;
                this.StateDates = data.StateDates;
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    // handle storage event (when other pages modify)
    _handleStorageEvent(event) {
        if (event.key === 'orderStateMachine') {
            try {
                if (event.newValue) {
                    const data = JSON.parse(event.newValue);
                    this.State = data.State;
                    this.StateDates = data.StateDates;

                    // trigger update event
                    this._triggerUpdateEvent();
                }
            } catch (error) {
                console.error('Failed to handle storage event:', error);
            }
        }
    }

    // trigger update event
    _triggerUpdateEvent() {
        const event = new CustomEvent('orderStateUpdated', {
            detail: { state: this.State, dates: this.StateDates }
        });
        window.dispatchEvent(event);
    }

    // listen for state changes
    onStateUpdate(callback) {
        window.addEventListener('orderStateUpdated', (e) => {
            callback(e.detail.state, e.detail.dates);
        });
    }

    // check if order exists
    hasOrder() {
        return this.State.OrderID !== '' && this.State.Created !== 'you dont have order';
    }

    // get order ID
    getOrderID() {
        return this.State.OrderID;
    }

    // reset order
    resetOrder() {
        this.State = {
            OrderID:     '',
            Created:     'you dont have order',
            OrderAccept: '',
            FoodPrepare: '',
            RiderAccept: '',
            Delivery:    '',
            OrderFinish: '',
            Cancel:      ''
        };

        this.StateDates = {
            Created:     null,
            OrderAccept: null,
            FoodPrepare: null,
            RiderAccept: null,
            Delivery:    null,
            OrderFinish: null,
            Cancel:      null
        };

        localStorage.removeItem('orderStateMachine');
    }
}

// create global singleton instance
window.osm = new OrderStateMachine();