// StateMachine.js

export class OrderStateMachine {
    constructor() {
      // init state
      this.State = {
        OrderID:     Math.round(Math.random()*10000),
        Created:     'notCreated',
        OrderAccept: 'notAccepted', 
        FoodPrepare: 'doing',
        RiderAccept: 'notAccepted',
        Delivery:    'notStart',
        OrderFinish: 'unfinish',
        Cancel:      '--'
      }
  
      // state change rule
      this.stateRules = {
        Created:     ['created'   , 'fail'],
        OrderAccept: ['accepted'  , 'fail'],
        FoodPrepare: ['finish'    , 'fail'],
        RiderAccept: ['accepted'  , 'fail'],
        Delivery:    ['delivering', 'fail'],
        OrderFinish: ['finish'    , 'fail'],
        Cancel:      ['canceled'  , '--']
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


    //** set Order state function **/
    changeStateCreated(change) {
        this.StateDates.Created = this.setTime();
        if (change){
            this.State.Created = this.stateRules.Created[0];
        }
        else{
            this.State.Created = this.stateRules.Created[1];
        }
      }
    
    changeStateOrderAccept(change) {
        this.StateDates.OrderAccept = this.setTime();
        if (change){
            this.State.OrderAccept = this.stateRules.OrderAccept[0];
        }
        else
            this.State.OrderAccept = this.stateRules.OrderAccept[1];
      }
    
    changeStateFoodPrepare(change) {
        this.StateDates.FoodPrepare = this.setTime();
        if (change){
            this.State.FoodPrepare = this.stateRules.FoodPrepare[0];
        }
        else
            this.State.FoodPrepare = this.stateRules.FoodPrepare[1];
      }
    
    changeStateRiderAccept(change) {
        this.StateDates.RiderAccept = this.setTime();
        if (change){
            this.State.RiderAccept = this.stateRules.RiderAccept[0];
        }
        else
            this.State.RiderAccept = this.stateRules.RiderAccept[1];
      }
    
    changeStateDelivery(change) {
        this.StateDates.Delivery = this.setTime();
        if (change){
            this.State.Delivery = this.stateRules.Delivery[0];
        }
        else
            this.State.Delivery = this.stateRules.Delivery[1];
      }
    
    changeStateOrderFinish(change) {
        this.StateDates.OrderFinish = this.setTime();
        if (change){
            this.State.OrderFinish = this.stateRules.OrderFinish[0];
        }
        else
            this.State.OrderFinish = this.stateRules.OrderFinish[1];
      }
    
    
    changeStatecancelOrder(change) {
        this.StateDates.Cancel = this.setTime();
        if (change){
            this.State.Cancel = this.stateRules.Cancel[0];
        }
        else
            this.State.Cancel = this.stateRules.Cancel[1];
      }
    //------ end -----//
    
    //return list of current state
    getCurrentState(){
        document.getElementById('orderId').textContent     = "OrderID: " + osm.State.OrderID ;
        const stateKeys = Object.keys(osm.State);
        var i = 1;
        var list = [];
        while(true){
            
            console.log(stateKeys[i], osm.State[stateKeys[i]], osm.StateDates[stateKeys[i]]);
            if(osm.StateDates[stateKeys[i]] === null){
                list.push(stateKeys[i] + ": " + osm.State[stateKeys[i]]);
                if(osm.StateDates.Cancel != null)
                    list.push("Order canceled...");
                break;
            }
            else
                list.push(stateKeys[i] + ": " + osm.State[stateKeys[i]] + " (" + osm.StateDates[stateKeys[i]] + ")");
            i++; 
        }
        console.log(list);
        return list;
    }

    //set time to (00:00) format
    setTime(){
        const now = new Date();

        const formatter = new Intl.DateTimeFormat('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        return formatter.format(now);
    }

}

