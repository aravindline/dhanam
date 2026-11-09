package in.aravindline.dhanam;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarms are cleared when the phone restarts, the app is updated or the clock changes: book again. */
public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) { Reminder.schedule(c); }
}
