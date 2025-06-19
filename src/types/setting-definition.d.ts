type SettingAction = 'get' | 'set';
type SettingActionOrigin = 'direct' | 'ui';

type SettingDefinition = BaseSettingDefinition | OptionsSettingDefinition | MultipleOptionsSettingDefinition | NumberStepperSettingDefinition;
type PrefInfo = {
    storage: AnySettingsStorage,
    definition: SettingDefinition,
    // value: unknown,
};

type SettingDefinitions<T extends AnyPref> = {
    [key in T]: SettingDefinition;
};

type NumberStepperParams = Partial<{
    steps: number;

    suffix: string;
    disabled: boolean;
    hideSlider: boolean;

    ticks: number;
    exactTicks: number;

    customTextValue: (value: any, min?: number, max?: number) => string | null;
    reverse: boolean;
}>
