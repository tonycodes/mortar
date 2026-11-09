package codes.tony.mortar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * A checkbox with a label, an optional description and an error, as the web
 * Checkbox. The whole row toggles; TalkBack reads a checkbox.
 */
@Composable
public fun MortarCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val p = Mortar.palette
    val shape = RoundedCornerShape(MortarTokens.radiusSm.dp)
    Row(
        modifier
            .heightIn(min = TouchTarget)
            .toggleable(checked, enabled = enabled, role = Role.Checkbox, onValueChange = onCheckedChange)
            .semantics { if (error != null) error(error) }
            .alpha(if (enabled) 1f else 0.5f),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(18.dp)
                .background(mortarColour(if (checked) p.primary else p.surface), shape)
                .border(
                    1.dp,
                    mortarColour(if (checked) p.primary else if (error != null) p.danger else p.lineStrong),
                    shape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            if (checked) Icon(Icons.Filled.Check, null, tint = mortarColour(p.onPrimary), modifier = Modifier.size(14.dp))
        }
        ChoiceText(label, description, error, required)
    }
}

/** One choice in a [MortarRadioGroup]. */
public data class MortarRadioOption<T>(
    public val value: T,
    public val label: String,
    public val description: String? = null,
    public val disabled: Boolean = false,
)

/** A labelled set of mutually exclusive choices, as the web RadioGroup. */
@Composable
public fun <T> MortarRadioGroup(
    label: String,
    selected: T?,
    onSelect: (T) -> Unit,
    options: List<MortarRadioOption<T>>,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
) {
    val p = Mortar.palette
    Column(modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            label,
            style = mortarText(13f, FontWeight.SemiBold),
            color = mortarColour(p.ink),
            modifier = Modifier.semantics { heading() },
        )
        if (hint != null) Text(hint, style = mortarText(12f), color = mortarColour(p.muted))
        if (error != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Info, null, tint = mortarColour(p.danger), modifier = Modifier.size(14.dp))
                Text(error, style = mortarText(12f), color = mortarColour(p.danger))
            }
        }
        for (option in options) {
            val isSelected = option.value == selected
            Row(
                Modifier
                    .heightIn(min = TouchTarget)
                    .selectable(isSelected, enabled = !option.disabled, role = Role.RadioButton) { onSelect(option.value) }
                    .alpha(if (option.disabled) 0.5f else 1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier
                        .size(18.dp)
                        .background(mortarColour(p.surface), CircleShape)
                        .border(
                            if (isSelected) 5.dp else 1.dp,
                            mortarColour(if (isSelected) p.primary else if (error != null) p.danger else p.lineStrong),
                            CircleShape,
                        ),
                )
                ChoiceText(option.label, option.description, null, false)
            }
        }
    }
}

@Composable
private fun ChoiceText(label: String, description: String?, error: String?, required: Boolean) {
    val p = Mortar.palette
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row {
            Text(label, style = mortarText(Mortar.brand.density.fontSize), color = mortarColour(p.ink))
            if (required) {
                Text(
                    " *",
                    style = mortarText(Mortar.brand.density.fontSize),
                    color = mortarColour(p.danger),
                    modifier = Modifier.semantics { contentDescription = "required" },
                )
            }
        }
        if (description != null) Text(description, style = mortarText(12f), color = mortarColour(p.muted))
        if (error != null) Text(error, style = mortarText(12f), color = mortarColour(p.danger))
    }
}
