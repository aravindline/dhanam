package in.aravindline.dhanam;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import java.util.Calendar;

/** Daily reminder at 8 pm (inexact window of 10 minutes, so no special alarm permission is needed). */
final class Reminder {
    static final String URL = "https://aravindline.github.io/dhanam/";
    static final String CHANNEL = "daily";
    static final String PREFS = "dhanam";

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static boolean enabled(Context c) { return prefs(c).getBoolean("on", true); }
    static int hour(Context c) { return prefs(c).getInt("hour", 20); }
    static int minute(Context c) { return prefs(c).getInt("minute", 0); }

    static PendingIntent alarmIntent(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class);
        return PendingIntent.getBroadcast(c, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Next 8 pm from now (today if it is still before 8 pm, else tomorrow). */
    static long nextTime(Context c) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour(c));
        cal.set(Calendar.MINUTE, minute(c));
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis() + 30000) cal.add(Calendar.DAY_OF_YEAR, 1);
        return cal.getTimeInMillis();
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = alarmIntent(c);
        am.cancel(pi);
        if (!enabled(c)) return;
        am.setWindow(AlarmManager.RTC_WAKEUP, nextTime(c), 10 * 60 * 1000L, pi);
    }

    static void ensureChannel(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "தினசரி நினைவூட்டல் / Daily reminder", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("இரவு 8 மணிக்கு செலவுகளை பதிவு செய்ய நினைவூட்டும்");
            nm.createNotificationChannel(ch);
        }
    }

    static PendingIntent openApp(Context c) {
        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(URL));
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void show(Context c) {
        ensureChannel(c);
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (!nm.areNotificationsEnabled()) return;
        Notification n = new Notification.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_notify)
                .setContentTitle("தனம் 🙏")
                .setContentText("இன்றைய வரவு செலவுகளை பதிவு செய்தீர்களா?")
                .setStyle(new Notification.BigTextStyle().bigText("இன்றைய வரவு செலவுகளை பதிவு செய்தீர்களா? பதிவு செய்ய இங்கே தொடவும்.\nDid you enter today's expenses? Tap to open."))
                .setContentIntent(openApp(c))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .build();
        nm.notify(1, n);
    }
}
