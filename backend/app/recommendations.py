def generate_recommendations(
    heat_risk,
    temperature,
    heat_index=None,
    wet_bulb=None
):
    level = heat_risk.get("level", "LOW")

    recommendations = []

    if level == "EXTREME":
        recommendations = [
            "Activate extreme heat emergency response",
            "Open cooling centers and prioritize vulnerable populations",
            "Issue immediate hydration and heat-exposure warnings",
            "Increase monitoring of high-risk hotspots",
            "Deploy emergency shade and water stations"
        ]

    elif level == "HIGH":
        recommendations = [
            "Open or extend cooling center operations",
            "Issue heat and hydration alerts",
            "Prioritize vulnerable populations for outreach",
            "Increase monitoring of identified hotspots",
            "Provide additional shaded public spaces"
        ]

    elif level == "MODERATE":
        recommendations = [
            "Monitor identified heat hotspots",
            "Encourage hydration and reduced outdoor exposure",
            "Increase availability of shaded areas",
            "Consider targeted cooling interventions",
            "Monitor conditions during peak afternoon hours"
        ]

    else:
        recommendations = [
            "Continue monitoring local heat conditions",
            "Maintain access to shaded public areas",
            "Encourage normal hydration",
            "Review heat conditions during peak hours"
        ]

    if temperature is not None and temperature >= 35:
        recommendations.append(
            "Prioritize areas where temperature exceeds 35°C"
        )

    if heat_index is not None and heat_index >= 41:
        recommendations.append(
            "Issue additional heat-index warnings for outdoor activities"
        )

    if wet_bulb is not None and wet_bulb >= 28:
        recommendations.append(
            "Increase monitoring because of elevated wet-bulb conditions"
        )

    return {
        "risk_level": level,
        "recommendations": recommendations
    }