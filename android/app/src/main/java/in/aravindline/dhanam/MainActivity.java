package in.aravindline.dhanam;

import android.Manifest;
import android.app.Activity;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.util.Locale;

/** One simple screen: open தனம், reminder on/off, reminder time. Text in Tamil and English. */
public class MainActivity extends Activity {
    private static final int BROWN = 0xFF7A3E12, BG = 0xFFF7F4EE, INK = 0xFF1C1B19;
    private TextView status;
    private Button toggle, timeBtn;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        Reminder.ensureChannel(this);
        Reminder.schedule(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(20), dp(36), dp(20), dp(24));
        col.setBackgroundColor(BG);

        TextView title = text("தனம்", 40, BROWN, true); title.setGravity(Gravity.CENTER); col.addView(title);
        TextView sub = text("தினசரி நினைவூட்டல் · Daily reminder", 18, INK, false); sub.setGravity(Gravity.CENTER); col.addView(sub);
        space(col, 24);
        Button open = button("📒  தனம் திற · Open Dhanam", BROWN, Color.WHITE);
        open.setOnClickListener(v -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Reminder.URL))));
        col.addView(open);
        space(col, 20);
        status = text("", 18, INK, false); col.addView(status);
        space(col, 12);
        timeBtn = button("", Color.WHITE, INK);
        timeBtn.setOnClickListener(v -> new TimePickerDialog(this, (tp, h, m) -> {
            Reminder.prefs(this).edit().putInt("hour", h).putInt("minute", m).apply(); Reminder.schedule(this); refresh();
        }, Reminder.hour(this), Reminder.minute(this), false).show());
        col.addView(timeBtn);
        space(col, 12);
        toggle = button("", Color.WHITE, INK);
        toggle.setOnClickListener(v -> { Reminder.prefs(this).edit().putBoolean("on", !Reminder.enabled(this)).apply(); Reminder.schedule(this); refresh(); });
        col.addView(toggle);
        space(col, 12);
        Button test = button("🔔  இப்போது சோதி · Test now", Color.WHITE, INK);
        test.setOnClickListener(v -> { Reminder.show(this); refresh(); });
        col.addView(test);

        ScrollView sv = new ScrollView(this); sv.setBackgroundColor(BG); sv.addView(col);
        setContentView(sv);
        refresh();
    }

    @Override protected void onResume() { super.onResume(); refresh(); }
    @Override public void onRequestPermissionsResult(int code, String[] p, int[] r) { refresh(); }

    private void refresh() {
        if (status == null) return;
        boolean allowed = getSystemService(android.app.NotificationManager.class).areNotificationsEnabled();
        int h = Reminder.hour(this), m = Reminder.minute(this);
        String time = String.format(Locale.ENGLISH, "%d:%02d %s", h % 12 == 0 ? 12 : h % 12, m, h < 12 ? "am" : "pm");
        if (!allowed) {
            status.setText("⚠️ அறிவிப்புகள் அனுமதிக்கப்படவில்லை. கீழே உள்ள பொத்தானைத் தொட்டு அனுமதிக்கவும்.\nNotifications are not allowed. Tap below to allow them.");
            toggle.setText("⚙️  அனுமதி கொடு · Allow notifications");
            toggle.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName())));
        } else {
            boolean on = Reminder.enabled(this);
            status.setText(on ? "✅ தினமும் " + time + " மணிக்கு நினைவூட்டும்.\nReminds you every day at " + time + "." : "⏸ நினைவூட்டல் நிறுத்தப்பட்டுள்ளது.\nReminder is off.");
            toggle.setText(on ? "நினைவூட்டலை நிறுத்து · Turn off" : "நினைவூட்டலை இயக்கு · Turn on");
            toggle.setOnClickListener(v -> { Reminder.prefs(this).edit().putBoolean("on", !Reminder.enabled(this)).apply(); Reminder.schedule(this); refresh(); });
        }
        timeBtn.setText("⏰  நேரம் மாற்று · Change time (" + time + ")");
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }
    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD); t.setLineSpacing(0, 1.2f); return t;
    }
    private Button button(String s, int bg, int fg) {
        Button bt = new Button(this); bt.setText(s); bt.setTextSize(18); bt.setTextColor(fg); bt.setAllCaps(false);
        bt.setMinHeight(dp(60)); bt.setPadding(dp(12), dp(10), dp(12), dp(10));
        GradientDrawable d = new GradientDrawable(); d.setColor(bg); d.setCornerRadius(dp(14)); d.setStroke(dp(2), bg == Color.WHITE ? 0xFFDDD7CB : bg);
        bt.setBackground(d); bt.setStateListAnimator(null); return bt;
    }
    private void space(LinearLayout l, int h) { View v = new View(this); l.addView(v, new LinearLayout.LayoutParams(1, dp(h))); }
}
