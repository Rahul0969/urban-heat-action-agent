def calculate_heat_risk(
    temperature=None,
    heat_index=None,
    wet_bulb=None,
    vegetation=None,
    impervious=None,
):
    score = 0

    if temperature is not None:
        if temperature >= 40:
            score += 4
        elif temperature >= 35:
            score += 3
        elif temperature >= 30:
            score += 2
        elif temperature >= 25:
            score += 1

    if heat_index is not None:
        if heat_index >= 50:
            score += 4
        elif heat_index >= 41:
            score += 3
        elif heat_index >= 32:
            score += 2
        elif heat_index >= 27:
            score += 1

    if wet_bulb is not None:
        if wet_bulb >= 30:
            score += 4
        elif wet_bulb >= 28:
            score += 3
        elif wet_bulb >= 25:
            score += 2

    if vegetation is not None:
        if vegetation < 0.2:
            score += 3
        elif vegetation < 0.4:
            score += 2
        elif vegetation < 0.6:
            score += 1

    if impervious is not None:
        if impervious >= 0.8:
            score += 3
        elif impervious >= 0.6:
            score += 2
        elif impervious >= 0.4:
            score += 1

    if score >= 12:
        level = "EXTREME"
    elif score >= 8:
        level = "HIGH"
    elif score >= 4:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "score": score,
        "level": level,
    }