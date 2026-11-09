package in.aravindline.dhanam;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Fires at 8 pm: shows the reminder and books the next day's. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        if (Reminder.enabled(c)) Reminder.show(c);
        Reminder.schedule(c);
    }
}
