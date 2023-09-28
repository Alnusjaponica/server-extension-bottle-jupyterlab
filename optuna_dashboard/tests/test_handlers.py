import json


async def test_get_hello(jp_fetch):
    # When
    response = await jp_fetch("optuna-dashboard", "hello")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"data": "This is /optuna-dashboard/hello endpoint!"}
